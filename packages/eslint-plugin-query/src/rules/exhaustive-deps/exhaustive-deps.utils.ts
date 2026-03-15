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

    if (queryFnScope === null) {
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
  isInstanceOfKind(node: TSESTree.Node) {
    return (
      node.type === AST_NODE_TYPES.BinaryExpression &&
      node.operator === 'instanceof'
    )
  },

  collectQueryKeyDeps(params: {
    sourceCode: Readonly<TSESLint.SourceCode>
    scopeManager: TSESLint.Scope.ScopeManager
    queryKeyNode: TSESTree.Node
  }): Set<string> {
    const { sourceCode, scopeManager, queryKeyNode } = params
    const deps = new Set<string>()
    const visitorKeys = sourceCode.visitorKeys

    function add(identifier: TSESTree.Identifier) {
      deps.add(ASTUtils.mapKeyNodeToBaseText(identifier, sourceCode))
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
        case AST_NODE_TYPES.Identifier:
          add(node)
          return
        case AST_NODE_TYPES.ArrowFunctionExpression:
        case AST_NODE_TYPES.FunctionExpression:
          for (const reference of ExhaustiveDepsUtils.collectExternalRefsInFunction(
            {
              functionNode: node,
              scopeManager: scopeManager,
            },
          )) {
            if (reference.identifier.type === AST_NODE_TYPES.Identifier) {
              add(reference.identifier)
            }
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
            deps.add(node.object.name)
          } else {
            visit(node.object)
          }
          return
        case AST_NODE_TYPES.CallExpression:
          node.arguments.forEach((argument) => visit(argument))
          if (
            node.callee.type === AST_NODE_TYPES.MemberExpression ||
            node.callee.type === AST_NODE_TYPES.ChainExpression ||
            node.callee.type === AST_NODE_TYPES.TSNonNullExpression
          ) {
            visit(node.callee)
          }
          return
      }

      visitChildren(node)
    }

    visit(queryKeyNode)

    return deps
  },

  isNode(value: unknown): value is TSESTree.Node {
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      typeof value.type === 'string'
    )
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
}
