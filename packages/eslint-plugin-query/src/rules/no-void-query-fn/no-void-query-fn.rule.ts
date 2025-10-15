import { ESLintUtils } from '@typescript-eslint/utils'
import { ASTUtils } from '../../utils/ast-utils'
import { detectTanstackQueryImports } from '../../utils/detect-react-query-imports'
import { getDocsUrl } from '../../utils/get-docs-url'
import type { ParserServicesWithTypeInformation } from '@typescript-eslint/utils'
import type { ExtraRuleDocs } from '../../types'

const TypeFlags = {
  Void: 16384,
  Undefined: 32768,
} as const

export const name = 'no-void-query-fn'

const createRule = ESLintUtils.RuleCreator<ExtraRuleDocs>(getDocsUrl)

export const rule = createRule({
  name,
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures queryFn returns a non-undefined value',
      recommended: 'error',
    },
    messages: {
      noVoidReturn: 'queryFn must return a non-undefined value',
    },
    schema: [],
  },
  defaultOptions: [],

  create: detectTanstackQueryImports((context) => {
    return {
      Property(node) {
        if (
          !ASTUtils.isObjectExpression(node.parent) ||
          !ASTUtils.isIdentifierWithName(node.key, 'queryFn')
        ) {
          return
        }

        const parserServices = context.sourceCode.parserServices

        if (
          !parserServices ||
          !parserServices.esTreeNodeToTSNodeMap ||
          !parserServices.program
        ) {
          return
        }

        const checker = parserServices.program.getTypeChecker()
        const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node.value)
        const type = checker.getTypeAtLocation(tsNode)

        // Get the return type of the function
        if (type.getCallSignatures().length > 0) {
          const returnType = type.getCallSignatures()[0]?.getReturnType()

          if (!returnType) {
            return
          }

          // Check if return type is void or undefined
          if (isIllegalReturn(checker, returnType)) {
            context.report({
              node: node.value,
              messageId: 'noVoidReturn',
            })
          }
        }
      },
    }
  }),
})

type Program = ParserServicesWithTypeInformation['program']
type TypeChecker = ReturnType<Program['getTypeChecker']>
type Type = ReturnType<TypeChecker['getTypeAtLocation']>

function isIllegalReturn(checker: TypeChecker, type: Type): boolean {
  const awaited = checker.getAwaitedType(type)

  if (!awaited) return false

  if (awaited.isUnion()) {
    return awaited.types.some((t) => isIllegalReturn(checker, t))
  }

  return awaited.flags & (TypeFlags.Void | TypeFlags.Undefined) ? true : false
}
