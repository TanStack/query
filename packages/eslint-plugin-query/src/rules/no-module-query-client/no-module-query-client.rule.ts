import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import { getDocsUrl } from '../../utils/get-docs-url'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import type { ExtraRuleDocs } from '../../types'

export const name = 'no-module-query-client'

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

const isNextJsFile = (fileName: string): boolean => {
  return (
    fileName.includes('_app.') ||
    fileName.includes('_document.') ||
    /(?:^|[/\\])(?:app|pages)[/\\]/.test(fileName)
  )
}

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow module-level QueryClient in Next.js to prevent cache sharing',
      recommended: 'error',
    },
    messages: {
      noModuleQueryClient:
        'QueryClient should not be created at module level in Next.js apps. Create it inside your component using useState or useRef.',
    },
    schema: [],
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context, _, helpers) => {
    const fileName = context.filename

    if (!isNextJsFile(fileName)) {
      return {}
    }

    return {
      NewExpression: (node) => {
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== 'QueryClient' ||
          !helpers.isSpecificTanstackQueryImport(
            node.callee,
            '@tanstack/react-query',
          )
        ) {
          return
        }

        const functionAncestor = ASTUtils.getFunctionAncestor(
          context.sourceCode,
          node,
        )

        if (functionAncestor === undefined) {
          context.report({
            node,
            messageId: 'noModuleQueryClient',
          })
        }
      },
    }
  }),
})
