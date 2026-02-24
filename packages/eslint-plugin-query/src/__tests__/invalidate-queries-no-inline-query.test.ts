import { RuleTester } from '@typescript-eslint/rule-tester'
import { rule } from '../rules/invalidate-queries-no-inline-query/invalidate-queries-no-inline-query.rule'

const ruleTester = new RuleTester()

ruleTester.run(rule.name, rule, {
  valid: [
    { code: `queryClient.invalidateQueries(usersQuery)` },
    { code: `queryClient.invalidateQueries({ ...usersQuery })` },
    { code: `queryClient.invalidateQueries({ ...usersQuery() })` },
  ],
  invalid: [
    {
      code: `queryClient.invalidateQueries({ queryKey: [] })`,
      errors: [{ messageId: 'no-inline-query' }],
    },
    {
      code: `queryClient.invalidateQueries({ ...queryOptions, queryKey: [] })`,
      errors: [{ messageId: 'no-inline-query' }],
    },
    {
      code: `queryClient.invalidateQueries({ queryFn: () => {} })`,
      errors: [{ messageId: 'no-inline-query' }],
    },
    {
      code: `queryClient.invalidateQueries({ ...queryOptions, queryFn: () => {} })`,
      errors: [{ messageId: 'no-inline-query' }],
    },
  ],
})
