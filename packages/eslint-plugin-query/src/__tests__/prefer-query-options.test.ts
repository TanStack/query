import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { rule } from '../rules/prefer-query-options/prefer-query-options.rule'

const ruleTester = new RuleTester()

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

// useQuery hooks
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
      errors: [{ messageId: 'no-inline-query-hook' }],
    },
    {
      code: `const users = useQuery({ ...queryOptions, queryKey: [] })`,
      errors: [{ messageId: 'no-inline-query-hook' }],
    },
    {
      code: `const users = useQuery({ queryFn: () => {} })`,
      errors: [{ messageId: 'no-inline-query-hook' }],
    },
    {
      code: `const users = useQuery({ ...queryOptions, queryFn: () => {} })`,
      errors: [{ messageId: 'no-inline-query-hook' }],
    },
  ],
})

// queryClient.invalidateQueries expressions
ruleTester.run(rule.name, rule, {
  valid: [
    { code: `queryClient.invalidateQueries(usersQuery)` },
    { code: `queryClient.invalidateQueries({ ...usersQuery })` },
    { code: `queryClient.invalidateQueries({ ...usersQuery() })` },
  ],
  invalid: [
    {
      code: `queryClient.invalidateQueries({ queryKey: [] })`,
      errors: [{ messageId: 'no-inline-query-invalidate' }],
    },
    {
      code: `queryClient.invalidateQueries({ ...queryOptions, queryKey: [] })`,
      errors: [{ messageId: 'no-inline-query-invalidate' }],
    },
    {
      code: `queryClient.invalidateQueries({ queryFn: () => {} })`,
      errors: [{ messageId: 'no-inline-query-invalidate' }],
    },
    {
      code: `queryClient.invalidateQueries({ ...queryOptions, queryFn: () => {} })`,
      errors: [{ messageId: 'no-inline-query-invalidate' }],
    },
  ],
})
