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
      !ExhaustiveDepsUtils.isFunctionCallTarget(reference.identifier) &&
      reference.identifier.parent.type !== AST_NODE_TYPES.NewExpression &&
      !ExhaustiveDepsUtils.isInstanceOfKind(reference.identifier.parent)
    )
  },

  isFunctionCallTarget(
    identifier: TSESTree.Identifier | TSESTree.JSXIdentifier,
  ): boolean {
    const callee = ASTUtils.traverseUpMemberExpression(identifier)

    return (
      callee.parent !== undefined &&
      callee.parent.type === AST_NODE_TYPES.CallExpression &&
      callee.parent.callee === callee
    )
  },

  /**
   * Given required refs and existing queryKey entries, compute missing dependency paths
   * respecting allowlisted variables and types.
   * @param params - The references the query function needs, the allowlisted variables, and the
   * root identifiers and full paths already in the query key.
   * @returns The missing dependency paths, without paths whose root is already missing.
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
   * @param params - The source code, the scope manager, and the query key node to scan.
   * @returns The root identifiers that cover all of their members, and every dependency path.
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

    /**
     * Records an identifier that covers all of its members.
     * @param name - The identifier, normalized before it is recorded.
     */
    function addRoot(name: string) {
      const cleaned = ExhaustiveDepsUtils.normalizeChain(name)
      roots.add(cleaned)
      paths.add(cleaned)
    }
    /**
     * Records a full member path.
     * @param text - The path, normalized before it is recorded.
     */
    function addFull(text: string) {
      const cleaned = ExhaustiveDepsUtils.normalizeChain(text)
      paths.add(cleaned)
    }
    /**
     * Records a computed reference path as a root or a full path.
     * @param refPath - The reference path, or `null` to record nothing.
     */
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

    /**
     * Visits every child node of a node.
     * @param node - The node whose children are visited.
     */
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

    /**
     * Records the dependencies of a node: identifiers directly, and the external references of
     * functions. Other nodes are visited recursively.
     * @param node - The node to visit.
     */
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
   * Checks whether the resolved variable is allowlisted by its type annotation.
   * @param params - The allowlisted type names, and the variable to check.
   * @returns `true` if a type referenced in the variable's type annotation is allowlisted.
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
      (node as TSESTree.SymmetricBinaryExpression).operator === 'instanceof'
    )
  },

  /**
   * Normalizes a chain by removing optional chaining operators
   *
   * Example: `a?.b.c!` -> `a.b.c`, `a?.[0]` -> `a[0]`
   * @param text - The source text of the chain.
   * @returns The chain without optional chaining, non-null assertions, and whitespace.
   */
  normalizeChain(text: string): string {
    return text
      .replace(/\?\.(?=\s*\[)/g, '')
      .replace(/(?:\?(\.)|!)/g, '$1')
      .replace(/\s+/g, '')
  },

  /**
   * Computes the reference path for an identifier
   *
   * Example: `a.b.c!` -> `{ path: 'a.b.c', root: 'a' }`
   * @param params - The identifier, and the source code to read the chain from.
   * @returns The dependency `path`, its `root`, and whether the path is the root itself and covers
   * all of its members. For a method call, the method name is dropped from the path.
   */
  computeRefPath(params: {
    identifier: TSESTree.Identifier
    sourceCode: Readonly<TSESLint.SourceCode>
  }): { path: string; root: string; coversRootMembers: boolean } | null {
    const { identifier, sourceCode } = params

    const fullChainNode = ASTUtils.traverseUpMemberExpression(identifier)

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

    /**
     * Collects the read references of a scope and its child scopes that resolve to variables
     * declared outside the function.
     * @param scope - The scope to collect from.
     */
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
   * Recursively collects type identifiers from a type annotation.
   * @param typeNode - The type to collect from: type references, unions, intersections, arrays, and
   * tuples are handled.
   * @param out - The set the type names are added to.
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
   * @param queryFn - The `queryFn` property.
   * @returns The nodes to scan for dependencies.
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
