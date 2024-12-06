import { AST_NODE_TYPES } from '@typescript-eslint/utils'
import { uniqueBy } from './unique-by'
import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

export const ASTUtils = {
  isNodeOfOneOf<T extends AST_NODE_TYPES>(
    node: TSESTree.Node,
    types: ReadonlyArray<T>,
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
  isIdentifierWithOneOfNames<T extends Array<string>>(
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
    properties: Array<TSESTree.ObjectLiteralElement>,
    key: string,
  ): TSESTree.Property | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    return properties.find((x) =>
      ASTUtils.isPropertyWithIdentifierKey(x, key),
    ) as TSESTree.Property | undefined
  },
  getNestedIdentifiers(node: TSESTree.Node): Array<TSESTree.Identifier> {
    const identifiers: Array<TSESTree.Identifier> = []

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

    if ('left' in node) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.left))
    }

    if ('right' in node) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.right))
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

    if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.body))
    }

    if (node.type === AST_NODE_TYPES.FunctionExpression) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.body))
    }

    if (node.type === AST_NODE_TYPES.BlockStatement) {
      identifiers.push(
        ...node.body.map((body) => ASTUtils.getNestedIdentifiers(body)).flat(),
      )
    }

    if (node.type === AST_NODE_TYPES.ReturnStatement && node.argument) {
      identifiers.push(...ASTUtils.getNestedIdentifiers(node.argument))
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
    allowedNodeTypes: Array<AST_NODE_TYPES>,
  ): TSESTree.Node {
    const parent = identifier.parent

    if (parent !== undefined && allowedNodeTypes.includes(parent.type)) {
      return ASTUtils.traverseUpOnly(parent, allowedNodeTypes)
    }

    return identifier
  },
  isDeclaredInNode(params: {
    functionNode: TSESTree.Node
    reference: TSESLint.Scope.Reference
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
  }): Array<TSESLint.Scope.Reference> {
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
        AST_NODE_TYPES.TSNonNullExpression,
        AST_NODE_TYPES.Identifier,
      ]),
    )
  },
  mapKeyNodeToBaseText(
    node: TSESTree.Node,
    sourceCode: Readonly<TSESLint.SourceCode>,
  ) {
    return ASTUtils.mapKeyNodeToText(node, sourceCode).replace(
      /(?:\?(\.)|!)/g,
      '$1',
    )
  },
  isValidReactComponentOrHookName(
    identifier: TSESTree.Identifier | null | undefined,
  ) {
    return (
      identifier !== null &&
      identifier !== undefined &&
      /^(use|[A-Z])/.test(identifier.name)
    )
  },
  getFunctionAncestor(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.Node,
  ) {
    for (const ancestor of sourceCode.getAncestors(node)) {
      if (
        ASTUtils.isNodeOfOneOf(ancestor, [
          AST_NODE_TYPES.FunctionDeclaration,
          AST_NODE_TYPES.FunctionExpression,
          AST_NODE_TYPES.ArrowFunctionExpression,
        ])
      ) {
        return ancestor
      }

      if (
        ancestor.parent?.type === AST_NODE_TYPES.VariableDeclarator &&
        ancestor.parent.id.type === AST_NODE_TYPES.Identifier &&
        ASTUtils.isNodeOfOneOf(ancestor, [
          AST_NODE_TYPES.FunctionDeclaration,
          AST_NODE_TYPES.FunctionExpression,
          AST_NODE_TYPES.ArrowFunctionExpression,
        ])
      ) {
        return ancestor
      }
    }

    return undefined
  },
  getReferencedExpressionByIdentifier(params: {
    node: TSESTree.Node
    context: Readonly<TSESLint.RuleContext<string, ReadonlyArray<unknown>>>
  }) {
    const { node, context } = params

    // we need the fallbacks for backwards compat with eslint < 8.37.0
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const sourceCode = context.sourceCode ?? context.getSourceCode()
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const scope = context.sourceCode.getScope(node)
      ? sourceCode.getScope(node)
      : context.getScope()

    const resolvedNode = scope.references.find((ref) => ref.identifier === node)
      ?.resolved?.defs[0]?.node

    if (resolvedNode?.type !== AST_NODE_TYPES.VariableDeclarator) {
      return null
    }

    return resolvedNode.init
  },
  getClosestVariableDeclarator(node: TSESTree.Node) {
    let currentNode: TSESTree.Node | undefined = node

    while (currentNode.type !== AST_NODE_TYPES.Program) {
      if (currentNode.type === AST_NODE_TYPES.VariableDeclarator) {
        return currentNode
      }

      currentNode = currentNode.parent
    }

    return undefined
  },
  getNestedReturnStatements(
    node: TSESTree.Node,
  ): Array<TSESTree.ReturnStatement> {
    const returnStatements: Array<TSESTree.ReturnStatement> = []

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
