import { RuleTester } from '@typescript-eslint/rule-tester'
import { rule } from '../rules/use-query-no-inline-query/use-query-no-inline-query.rule'

const ruleTester = new RuleTester()

ruleTester.run(rule.name, rule, {
  valid: [
    { code: `useQuery(usersQuery)` },
    { code: `useQuery({ ...usersQuery })` },
    { code: `useQuery({ ...usersQuery() })` },
    { code: `useQuery({ ...usersQuery, meta: {} })` },
  ],
  invalid: [
    {
      code: `useQuery({ queryKey: [] })`,
      errors: [{ messageId: 'no-inline-query' }],
    },
    {
      code: `const users = useQuery({ ...queryOptions, queryKey: [] })`,
      errors: [{ messageId: 'no-inline-query' }],
    },
    {
      code: `const users = useQuery({ queryFn: () => {} })`,
      errors: [{ messageId: 'no-inline-query' }],
    },
    {
      code: `const users = useQuery({ ...queryOptions, queryFn: () => {} })`,
      errors: [{ messageId: 'no-inline-query' }],
    },
  ],
})
