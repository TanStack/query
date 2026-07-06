import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

export const ExhaustiveDepsUtils = {
  isRelevantReference(params: {
    sourceCode: Readonly<TSESLint.SourceCode>
    reference: TSESLint.Scope.Reference
    scopeManager: TSESLint.Scope.ScopeManager
    node: TSESTree.Node
    filename: string
  }) {
    const { sourceCode, reference, scopeManager, node, filename } = params
    const component = ASTUtils.getFunctionAncestor(sourceCode, node)
    const queryFnScope = scopeManager.acquire(node)

    if (queryFnScope === null || reference.isValueReference === false) {
      return false
    }

    let currentScope = reference.resolved?.scope ?? null
    while (currentScope !== null) {
      if (currentScope === queryFnScope) {
        return false
      }

      currentScope = currentScope.upper
    }

    if (component !== undefined) {
      if (
        !ASTUtils.isDeclaredInNode({
          scopeManager,
          reference,
          functionNode: component,
        })
      ) {
        return false
      }
    } else {
      const isVueFile = filename.endsWith('.vue')

      if (!isVueFile) {
        return false
      }

      const definition = reference.resolved?.defs[0]
      const isGlobalVariable = definition === undefined
      const isImport = definition?.type === 'ImportBinding'

      if (isGlobalVariable || isImport) {
        return false
      }
    }

    return (
      reference.identifier.name !== 'undefined' &&
      reference.identifier.parent.type !== AST_NODE_TYPES.NewExpression &&
      !ExhaustiveDepsUtils.isInstanceOfKind(reference.identifier.parent)
    )
  },

  /**
   * Given required refs and existing queryKey entries, compute missing dependency paths
   * respecting allowlisted variables and types.
   */
  computeFilteredMissingPaths(params: {
    requiredRefs: Array<{
      path: string
      root: string
      allowlistedByType: boolean
    }>
    allowlistedVariables: Set<string>
    existingRootIdentifiers: Set<string>
    existingFullPaths: Set<string>
  }): Array<string> {
    const {
      requiredRefs,
      allowlistedVariables,
      existingRootIdentifiers,
      existingFullPaths,
    } = params

    const missingPaths = new Set<string>()

    for (const { root, path, allowlistedByType } of requiredRefs) {
      // If root itself is present in the key, it covers all members
      if (existingRootIdentifiers.has(root)) continue
      if (allowlistedVariables.has(root)) continue
      if (existingFullPaths.has(path)) continue
      if (allowlistedByType) continue

      missingPaths.add(path)
    }

    // Collapse descendants: if a root is already missing, drop deeper paths
    for (const path of missingPaths) {
      const root = path.split('.')[0]
      if (root !== path && root !== undefined && missingPaths.has(root)) {
        missingPaths.delete(path)
      }
    }

    return Array.from(missingPaths)
  },

  /**
   * Extract existing queryKey deps as root identifiers and full member paths.
   */
  collectQueryKeyDeps(params: {
    sourceCode: Readonly<TSESLint.SourceCode>
    scopeManager: TSESLint.Scope.ScopeManager
    queryKeyNode: TSESTree.Node
  }): { roots: Set<string>; paths: Set<string> } {
    const { sourceCode, scopeManager, queryKeyNode } = params
    const roots = new Set<string>()
    const paths = new Set<string>()
    const visitorKeys = sourceCode.visitorKeys

    function addRoot(name: string) {
      const cleaned = ExhaustiveDepsUtils.normalizeChain(name)
      roots.add(cleaned)
      paths.add(cleaned)
    }
    function addFull(text: string) {
      const cleaned = ExhaustiveDepsUtils.normalizeChain(text)
      paths.add(cleaned)
    }
    function addRefPath(
      refPath: {
        path: string
        root: string
        coversRootMembers: boolean
      } | null,
    ) {
      if (!refPath) return

      if (refPath.coversRootMembers) {
        addRoot(refPath.root)
        return
      }

      addFull(refPath.path)
    }

    function visitChildren(node: TSESTree.Node): void {
      const keys = (visitorKeys[node.type] ?? []) as ReadonlyArray<
        keyof TSESTree.Node
      >

      for (const key of keys) {
        const value = node[key]

        if (Array.isArray(value)) {
          for (const item of value) {
            if (ExhaustiveDepsUtils.isNode(item)) {
              visit(item)
            }
          }
          continue
        }

        if (ExhaustiveDepsUtils.isNode(value)) {
          visit(value)
        }
      }
    }

    function visit(node: TSESTree.Node | null | undefined): void {
      if (!node) return

      switch (node.type) {
        case AST_NODE_TYPES.Identifier: {
          addRefPath(
            ExhaustiveDepsUtils.computeRefPath({
              identifier: node,
              sourceCode: sourceCode,
            }),
          )
          return
        }
        case AST_NODE_TYPES.ArrowFunctionExpression:
        case AST_NODE_TYPES.FunctionExpression:
          for (const reference of ExhaustiveDepsUtils.collectExternalRefsInFunction(
            {
              functionNode: node,
              scopeManager: scopeManager,
            },
          )) {
            if (reference.identifier.type !== AST_NODE_TYPES.Identifier) {
              continue
            }

            addRefPath(
              ExhaustiveDepsUtils.computeRefPath({
                identifier: reference.identifier,
                sourceCode: sourceCode,
              }),
            )
          }
          return
        case AST_NODE_TYPES.Property:
          visit(node.value)
          return
        case AST_NODE_TYPES.MemberExpression:
          if (
            node.parent.type === AST_NODE_TYPES.CallExpression &&
            node.parent.callee === node &&
            node.object.type === AST_NODE_TYPES.Identifier
          ) {
            addRoot(node.object.name)
          } else {
            visit(node.object)
          }
          return
        case AST_NODE_TYPES.CallExpression:
          node.arguments.forEach((argument) => visit(argument))
          switch (node.callee.type) {
            case AST_NODE_TYPES.Identifier:
            case AST_NODE_TYPES.MemberExpression:
            case AST_NODE_TYPES.ChainExpression:
            case AST_NODE_TYPES.TSNonNullExpression:
              visit(node.callee)
              break
          }
          return
      }

      visitChildren(node)
    }

    visit(queryKeyNode)

    return { roots, paths }
  },

  isNode(value: unknown): value is TSESTree.Node {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      typeof value.type === 'string'
    )
  },

  /**
   * Checks whether the resolved variable is allowlisted by its type annotation
   */
  variableIsAllowlistedByType(params: {
    allowlistedTypes: Set<string>
    variable: TSESLint.Scope.Variable | null
  }): boolean {
    const { allowlistedTypes, variable } = params
    if (allowlistedTypes.size === 0) return false
    if (!variable) return false

    for (const id of variable.identifiers) {
      if (id.typeAnnotation) {
        const typeIdentifiers = new Set<string>()
        ExhaustiveDepsUtils.collectTypeIdentifiers(
          id.typeAnnotation.typeAnnotation,
          typeIdentifiers,
        )
        for (const typeIdentifier of typeIdentifiers) {
          if (allowlistedTypes.has(typeIdentifier)) return true
        }
      }
    }

    return false
  },
  isInstanceOfKind(node: TSESTree.Node) {
    return (
      node.type === AST_NODE_TYPES.BinaryExpression &&
      node.operator === 'instanceof'
    )
  },

  /**
   * Normalizes a chain by removing optional chaining operators
   *
   * Example: `a?.b.c!` -> `a.b.c`
   */
  normalizeChain(text: string): string {
    return text.replace(/(?:\?(\.)|!)/g, '$1').replace(/\s+/g, '')
  },

  /**
   * Computes the reference path for an identifier
   *
   * Example: `a.b.c!` -> `{ path: 'a.b.c', root: 'a' }`
   */
  computeRefPath(params: {
    identifier: TSESTree.Identifier
    sourceCode: Readonly<TSESLint.SourceCode>
  }): { path: string; root: string; coversRootMembers: boolean } | null {
    const { identifier, sourceCode } = params

    const fullChainNode = ASTUtils.traverseUpOnly(identifier, [
      AST_NODE_TYPES.MemberExpression,
      AST_NODE_TYPES.TSNonNullExpression,
      AST_NODE_TYPES.Identifier,
    ])

    const fullText = ExhaustiveDepsUtils.normalizeChain(
      sourceCode.getText(fullChainNode),
    )

    const parent = fullChainNode.parent
    let dependencyPath = fullText
    let coversRootMembers = fullText === identifier.name

    if (
      parent &&
      parent.type === AST_NODE_TYPES.CallExpression &&
      parent.callee === fullChainNode
    ) {
      const segments = fullText.split('.')
      if (segments.length > 1) {
        dependencyPath = segments.slice(0, -1).join('.')
      }

      coversRootMembers = false
    }

    dependencyPath =
      dependencyPath.split('.')[0] === '' ? identifier.name : dependencyPath
    const root = dependencyPath.split('.')[0]

    return {
      path: dependencyPath,
      root: root ?? identifier.name,
      coversRootMembers: coversRootMembers && dependencyPath === root,
    }
  },

  collectExternalRefsInFunction(params: {
    functionNode: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression
    scopeManager: TSESLint.Scope.ScopeManager
  }): Array<TSESLint.Scope.Reference> {
    const { functionNode, scopeManager } = params
    const functionScope = scopeManager.acquire(functionNode)

    if (functionScope === null) {
      return []
    }

    const externalRefs: Array<TSESLint.Scope.Reference> = []

    function collect(scope: TSESLint.Scope.Scope) {
      for (const reference of scope.references) {
        if (!reference.isRead() || reference.resolved === null) {
          continue
        }

        let currentScope: TSESLint.Scope.Scope | null = reference.resolved.scope
        let declaredInsideFunction = false

        while (currentScope !== null) {
          if (currentScope === functionScope) {
            declaredInsideFunction = true
            break
          }

          currentScope = currentScope.upper
        }

        if (!declaredInsideFunction) {
          externalRefs.push(reference)
        }
      }

      for (const childScope of scope.childScopes) {
        collect(childScope)
      }
    }

    collect(functionScope)

    return externalRefs
  },

  /**
   * Recursively collects type identifiers from a type annotation
   */
  collectTypeIdentifiers(typeNode: TSESTree.TypeNode, out: Set<string>): void {
    switch (typeNode.type) {
      case AST_NODE_TYPES.TSTypeReference: {
        if (typeNode.typeName.type === AST_NODE_TYPES.Identifier) {
          out.add(typeNode.typeName.name)
        }
        break
      }
      case AST_NODE_TYPES.TSUnionType:
      case AST_NODE_TYPES.TSIntersectionType: {
        typeNode.types.forEach((t) =>
          ExhaustiveDepsUtils.collectTypeIdentifiers(t, out),
        )
        break
      }
      case AST_NODE_TYPES.TSArrayType: {
        ExhaustiveDepsUtils.collectTypeIdentifiers(typeNode.elementType, out)
        break
      }
      case AST_NODE_TYPES.TSTupleType: {
        typeNode.elementTypes.forEach((et) =>
          ExhaustiveDepsUtils.collectTypeIdentifiers(et, out),
        )
        break
      }
    }
  },

  /**
   * Gets the function expression nodes from a queryFn property, handling conditional expressions.
   * When neither branch is skipToken, returns both branches so all deps are scanned.
   */
  getQueryFnNodes(queryFn: TSESTree.Property): Array<TSESTree.Node> {
    if (queryFn.value.type !== AST_NODE_TYPES.ConditionalExpression) {
      return [queryFn.value]
    }

    if (
      queryFn.value.consequent.type === AST_NODE_TYPES.Identifier &&
      queryFn.value.consequent.name === 'skipToken'
    ) {
      return [queryFn.value.alternate]
    }

    if (
      queryFn.value.alternate.type === AST_NODE_TYPES.Identifier &&
      queryFn.value.alternate.name === 'skipToken'
    ) {
      return [queryFn.value.consequent]
    }

    return [queryFn.value.consequent, queryFn.value.alternate]
  },
}
