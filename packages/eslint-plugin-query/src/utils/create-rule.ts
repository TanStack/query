import { ESLintUtils } from '@typescript-eslint/utils'
import { detectTanstackQueryImports } from './detect-react-query-imports'
import type { EnhancedCreate } from './detect-react-query-imports'

const getDocsUrl = (ruleName: string): string =>
  `https://tanstack.com/query/v4/docs/eslint/${ruleName}`

type EslintRule = Omit<
  Parameters<ReturnType<typeof ESLintUtils.RuleCreator>>[0],
  'create'
> & {
  create: EnhancedCreate
}

export function createRule({ create, ...rest }: EslintRule) {
  return ESLintUtils.RuleCreator(getDocsUrl)({
    ...rest,
    create: detectTanstackQueryImports(create),
  })
}
