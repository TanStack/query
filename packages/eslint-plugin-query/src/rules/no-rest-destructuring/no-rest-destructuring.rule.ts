import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { ASTUtils } from '../../utils/ast-utils'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { NoRestDestructuringUtils } from './no-rest-destructuring.utils'
import type { TSESTree } from '@typescript-eslint/utils'
import type { ExtraRuleDocs } from '../../types'

export const name = 'no-rest-destructuring'

const queryHooks = [
  'useQuery',
  'useQueries',
  'useInfiniteQuery',
  'useSuspenseQuery',
  'useSuspenseQueries',
  'useSuspenseInfiniteQuery',
]

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallows rest destructuring in queries',
      recommended: 'warn',
    },
    messages: {
      objectRestDestructure: `Object rest destructuring on a query will observe all changes to the query, leading to excessive re-renders.`,
    },
    schema: [],
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context, _, helpers) => {
    const queryResultVariables = new Set<string>()

    const isTanstackQueryHook = (identifier: TSESTree.Identifier): boolean => {
      return (
        ASTUtils.isIdentifierWithOneOfNames(identifier, queryHooks) &&
        helpers.isTanstackQueryImport(identifier)
      )
    }

    const unwrap = (node: TSESTree.Node): TSESTree.Node => {
      if (
        node.type === AST_NODE_TYPES.TSAsExpression ||
        node.type === AST_NODE_TYPES.TSSatisfiesExpression ||
        node.type === AST_NODE_TYPES.TSTypeAssertion ||
        node.type === AST_NODE_TYPES.ChainExpression ||
        node.type === AST_NODE_TYPES.TSNonNullExpression
      ) {
        return unwrap(node.expression)
      }

      return node
    }

    const getReferencedNode = (
      identifier: TSESTree.Identifier,
    ): TSESTree.Node | null => {
      const referencedExpression = ASTUtils.getReferencedExpressionByIdentifier(
        {
          context,
          node: identifier,
        },
      )

      if (referencedExpression !== null) {
        return referencedExpression
      }

      const scope = context.sourceCode.getScope(identifier)
      const reference = scope.references.find(
        (ref) => ref.identifier === identifier,
      )
      const definition = reference?.resolved?.defs[0]?.node as
        | TSESTree.Node
        | undefined

      if (definition?.type === AST_NODE_TYPES.VariableDeclarator) {
        return definition.init ?? null
      }

      if (definition !== undefined) {
        return definition
      }

      return null
    }

    const getDirectReturnExpression = (
      fn:
        | TSESTree.FunctionDeclaration
        | TSESTree.FunctionExpression
        | TSESTree.ArrowFunctionExpression,
    ): TSESTree.Expression | null => {
      if (fn.body.type !== AST_NODE_TYPES.BlockStatement) {
        return fn.body
      }

      const returnStatements = fn.body.body.filter(
        (statement): statement is TSESTree.ReturnStatement =>
          statement.type === AST_NODE_TYPES.ReturnStatement,
      )

      if (returnStatements.length !== 1) {
        return null
      }

      const [returnStatement] = returnStatements

      return returnStatement?.argument ?? null
    }

    const isQueryResultNode = (
      node: TSESTree.Node | null,
      seen: Set<string>,
    ): boolean => {
      if (node === null) {
        return false
      }

      const unwrapped = unwrap(node)

      if (unwrapped.type === AST_NODE_TYPES.Identifier) {
        return isQueryResultIdentifier(unwrapped, seen)
      }

      if (unwrapped.type !== AST_NODE_TYPES.CallExpression) {
        return false
      }

      if (unwrapped.callee.type !== AST_NODE_TYPES.Identifier) {
        return false
      }

      if (isTanstackQueryHook(unwrapped.callee)) {
        return true
      }

      return isQueryResultIdentifier(unwrapped.callee, seen)
    }

    const isQueryResultIdentifier = (
      node: TSESTree.Identifier,
      seen: Set<string>,
    ): boolean => {
      if (isTanstackQueryHook(node)) {
        return true
      }

      if (seen.has(node.name)) {
        return false
      }

      seen.add(node.name)

      const referenced = getReferencedNode(node)
      if (referenced === null || referenced === node) {
        return false
      }

      const unwrapped = unwrap(referenced)

      if (
        unwrapped.type === AST_NODE_TYPES.FunctionDeclaration ||
        unwrapped.type === AST_NODE_TYPES.FunctionExpression ||
        unwrapped.type === AST_NODE_TYPES.ArrowFunctionExpression
      ) {
        const returned = getDirectReturnExpression(unwrapped)
        return isQueryResultNode(returned, seen)
      }

      return isQueryResultNode(unwrapped, seen)
    }

    const isQueryResultHookCall = (node: TSESTree.CallExpression): boolean => {
      return isQueryResultNode(node, new Set<string>())
    }

    return {
      VariableDeclarator: (node) => {
        if (
          node.init?.type === AST_NODE_TYPES.Identifier &&
          queryResultVariables.has(node.init.name) &&
          NoRestDestructuringUtils.isObjectRestDestructuring(node.id)
        ) {
          context.report({
            node,
            messageId: 'objectRestDestructure',
          })
        }
      },

      CallExpression: (node) => {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          !isQueryResultHookCall(node)
        ) {
          return
        }

        if (node.parent.type !== AST_NODE_TYPES.VariableDeclarator) {
          return
        }

        const returnValue = node.parent.id

        if (
          node.callee.name !== 'useQueries' &&
          node.callee.name !== 'useSuspenseQueries'
        ) {
          if (NoRestDestructuringUtils.isObjectRestDestructuring(returnValue)) {
            return context.report({
              node: node.parent,
              messageId: 'objectRestDestructure',
            })
          }

          if (returnValue.type === AST_NODE_TYPES.Identifier) {
            queryResultVariables.add(returnValue.name)
          }

          return
        }

        if (returnValue.type !== AST_NODE_TYPES.ArrayPattern) {
          if (returnValue.type === AST_NODE_TYPES.Identifier) {
            queryResultVariables.add(returnValue.name)
          }
          return
        }

        returnValue.elements.forEach((queryResult) => {
          if (queryResult === null) {
            return
          }

          if (NoRestDestructuringUtils.isObjectRestDestructuring(queryResult)) {
            context.report({
              node: queryResult,
              messageId: 'objectRestDestructure',
            })
          }
        })
      },

      SpreadElement: (node) => {
        if (
          node.argument.type === AST_NODE_TYPES.Identifier &&
          queryResultVariables.has(node.argument.name)
        ) {
          context.report({
            node,
            messageId: 'objectRestDestructure',
          })
        }
      },
    }
  }),
})
