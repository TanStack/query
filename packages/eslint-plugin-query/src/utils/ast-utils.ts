import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import type TSESLintScopeManager from '@typescript-eslint/scope-manager'
import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import type { RuleContext } from '@typescript-eslint/utils/dist/ts-eslint'
import { uniqueBy } from './unique-by'

export const ASTUtils = {
  isNodeOfOneOf<T extends AST_NODE_TYPES>(
    node: TSESTree.Node,
    types: readonly T[],
  ): node is TSESTree.Node & { type: T } {
    return types.includes(node.type as T)
  },
  isIdentifier(node: TSESTree.Node): node is TSESTree.Identifier {
    return node.type === AST_NODE_TYPES.Identifier
  },
  isIdentifierWithName(
    node: TSESTree.Node,
    name: string,
  ): node is TSESTree.Identifier {
    return ASTUtils.isIdentifier(node) && node.name === name
  },
  isIdentifierWithOneOfNames<T extends string[]>(
    node: TSESTree.Node,
    name: T,
  ): node is TSESTree.Identifier & { name: T[number] } {
    return ASTUtils.isIdentifier(node) && name.includes(node.name)
  },
  isProperty(node: TSESTree.Node): node is TSESTree.Property {
    return node.type === AST_NODE_TYPES.Property
  },
  isObjectExpression(node: TSESTree.Node): node is TSESTree.ObjectExpression {
    return node.type === AST_NODE_TYPES.ObjectExpression
  },
  isPropertyWithIdentifierKey(
    node: TSESTree.Node,
    key: string,
  ): node is TSESTree.Property {
    return (
      ASTUtils.isProperty(node) && ASTUtils.isIdentifierWithName(node.key, key)
    )
  },
  findPropertyWithIdentifierKey(
    properties: TSESTree.ObjectLiteralElement[],
    key: string,
  ): TSESTree.Property | undefined {
    return properties.find((x) =>
      ASTUtils.isPropertyWithIdentifierKey(x, key),
    ) as TSESTree.Property | undefined
  },
  getNestedIdentifiers(node: TSESTree.Node): TSESTree.Identifier[] {
    const identifiers: TSESTree.Identifier[] = []

    if (ASTUtils.isIdentifier(node)) {
      identifiers.push(node)
    }

    if ('arguments' in node) {
      node.arguments.forEach((x) => {
        identifiers.push(...ASTUtils.getNestedIdentifiers(x))
      })
    }

    if ('elements' in node) {
      node.elements.forEach((x) => {
        if (x !== null) {
          identifiers.push(...ASTUtils.getNestedIdentifiers(x))
        }
      })
    }

    if ('properties' in node) {
      node.properties.forEach((x) => {
        identifiers.push(...ASTUtils.getNestedIdentifiers(x))
      })
    }

    if ('expressions' in node) {
      node.expressions.forEach((x) => {
        identifiers.push(...ASTUtils.getNestedIdentifiers(x))
      })
    }

    if (node.type === AST_NODE_TYPES.Property) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.value))
    }

    if (node.type === AST_NODE_TYPES.SpreadElement) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.argument))
    }

    if (node.type === AST_NODE_TYPES.MemberExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.object))
    }

    if (node.type === AST_NODE_TYPES.UnaryExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.argument))
    }

    if (node.type === AST_NODE_TYPES.ChainExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.expression))
    }

    if (node.type === AST_NODE_TYPES.TSNonNullExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.expression))
    }

    return identifiers
  },
  isAncestorIsCallee(identifier: TSESTree.Node) {
    let previousNode = identifier
    let currentNode = identifier.parent

    while (currentNode !== undefined) {
      if (
        currentNode.type === AST_NODE_TYPES.CallExpression &&
        currentNode.callee === previousNode
      ) {
        return true
      }

      if (currentNode.type !== AST_NODE_TYPES.MemberExpression) {
        return false
      }

      previousNode = currentNode
      currentNode = currentNode.parent
    }

    return false
  },
  traverseUpOnly(
    identifier: TSESTree.Node,
    allowedNodeTypes: AST_NODE_TYPES[],
  ): TSESTree.Node {
    const parent = identifier.parent

    if (parent !== undefined && allowedNodeTypes.includes(parent.type)) {
      return ASTUtils.traverseUpOnly(parent, allowedNodeTypes)
    }

    return identifier
  },
  isDeclaredInNode(params: {
    functionNode: TSESTree.Node
    reference: TSESLintScopeManager.Reference
    scopeManager: TSESLint.Scope.ScopeManager
  }) {
    const { functionNode, reference, scopeManager } = params
    const scope = scopeManager.acquire(functionNode)

    if (scope === null) {
      return false
    }

    return scope.set.has(reference.identifier.name)
  },
  getExternalRefs(params: {
    scopeManager: TSESLint.Scope.ScopeManager
    sourceCode: Readonly<TSESLint.SourceCode>
    node: TSESTree.Node
  }): TSESLint.Scope.Reference[] {
    const { scopeManager, sourceCode, node } = params
    const scope = scopeManager.acquire(node)

    if (scope === null) {
      return []
    }

    const references = scope.references
      .filter((x) => x.isRead() && !scope.set.has(x.identifier.name))
      .map((x) => {
        const referenceNode = ASTUtils.traverseUpOnly(x.identifier, [
          AST_NODE_TYPES.MemberExpression,
          AST_NODE_TYPES.Identifier,
        ])

        return {
          variable: x,
          node: referenceNode,
          text: sourceCode.getText(referenceNode),
        }
      })

    const localRefIds = new Set(
      [...scope.set.values()].map((x) => sourceCode.getText(x.identifiers[0])),
    )

    const externalRefs = references.filter(
      (x) => x.variable.resolved === null || !localRefIds.has(x.text),
    )

    return uniqueBy(externalRefs, (x) => x.text).map((x) => x.variable)
  },
  mapKeyNodeToText(
    node: TSESTree.Node,
    sourceCode: Readonly<TSESLint.SourceCode>,
  ) {
    return sourceCode.getText(
      ASTUtils.traverseUpOnly(node, [
        AST_NODE_TYPES.MemberExpression,
        AST_NODE_TYPES.Identifier,
      ]),
    )
  },
  isValidReactComponentOrHookName(identifier: TSESTree.Identifier | null) {
    return identifier !== null && /^(use|[A-Z])/.test(identifier.name)
  },
  getFunctionAncestor(
    context: Readonly<RuleContext<string, readonly unknown[]>>,
  ) {
    return context.getAncestors().find((x) => {
      if (x.type === AST_NODE_TYPES.FunctionDeclaration) {
        return true
      }

      return (
        x.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
        x.parent.id.type === AST_NODE_TYPES.Identifier &&
        ASTUtils.isNodeOfOneOf(x, [
          AST_NODE_TYPES.FunctionDeclaration,
          AST_NODE_TYPES.FunctionExpression,
          AST_NODE_TYPES.ArrowFunctionExpression,
        ])
      )
    })
  },
  getReferencedExpressionByIdentifier(params: {
    node: TSESTree.Node
    context: Readonly<RuleContext<string, readonly unknown[]>>
  }) {
    const { node, context } = params

    const resolvedNode = context
      .getScope()
      .references.find((ref) => ref.identifier === node)?.resolved
      ?.defs[0]?.node

    if (resolvedNode?.type !== AST_NODE_TYPES.VariableDeclarator) {
      return null
    }

    return resolvedNode.init
  },
  getNestedReturnStatements(node: TSESTree.Node): TSESTree.ReturnStatement[] {
    const returnStatements: TSESTree.ReturnStatement[] = []

    if (node.type === AST_NODE_TYPES.ReturnStatement) {
      returnStatements.push(node)
    }

    if ('body' in node && node.body !== undefined && node.body !== null) {
      Array.isArray(node.body)
        ? node.body.forEach((x) => {
            returnStatements.push(...ASTUtils.getNestedReturnStatements(x))
          })
        : returnStatements.push(
            ...ASTUtils.getNestedReturnStatements(node.body),
          )
    }

    if ('consequent' in node) {
      Array.isArray(node.consequent)
        ? node.consequent.forEach((x) => {
            returnStatements.push(...ASTUtils.getNestedReturnStatements(x))
          })
        : returnStatements.push(
            ...ASTUtils.getNestedReturnStatements(node.consequent),
          )
    }

    if ('alternate' in node && node.alternate !== null) {
      Array.isArray(node.alternate)
        ? node.alternate.forEach((x) => {
            returnStatements.push(...ASTUtils.getNestedReturnStatements(x))
          })
        : returnStatements.push(
            ...ASTUtils.getNestedReturnStatements(node.alternate),
          )
    }

    if ('cases' in node) {
      node.cases.forEach((x) => {
        returnStatements.push(...ASTUtils.getNestedReturnStatements(x))
      })
    }

    if ('block' in node) {
      returnStatements.push(...ASTUtils.getNestedReturnStatements(node.block))
    }

    if ('handler' in node && node.handler !== null) {
      returnStatements.push(...ASTUtils.getNestedReturnStatements(node.handler))
    }

    if ('finalizer' in node && node.finalizer !== null) {
      returnStatements.push(
        ...ASTUtils.getNestedReturnStatements(node.finalizer),
      )
    }

    if (
      'expression' in node &&
      node.expression !== true &&
      node.expression !== false
    ) {
      returnStatements.push(
        ...ASTUtils.getNestedReturnStatements(node.expression),
      )
    }

    if ('test' in node && node.test !== null) {
      returnStatements.push(...ASTUtils.getNestedReturnStatements(node.test))
    }

    return returnStatements
  },
}
