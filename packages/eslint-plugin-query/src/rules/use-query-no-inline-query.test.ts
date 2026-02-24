import "../_test/setup.js";

import { RuleTester } from "@typescript-eslint/rule-tester";

import requireQueryOptions from "./use-query-no-inline-query.js";

const ruleTester = new RuleTester({});

ruleTester.run(requireQueryOptions.name, requireQueryOptions.rule, {
  valid: [
    { code: `useQuery(usersQuery)` },
    { code: `useQuery({ ...usersQuery })` },
    { code: `useQuery({ ...usersQuery() })` },
    { code: `useQuery({ ...usersQuery, meta: {} })` },
  ],
  invalid: [
    {
      code: `useQuery({ queryKey: [] })`,
      errors: [{ messageId: "no-inline-query" }],
    },
    {
      code: `const users = useQuery({ ...queryOptions, queryKey: [] })`,
      errors: [{ messageId: "no-inline-query" }],
    },
    {
      code: `const users = useQuery({ queryFn: () => {} })`,
      errors: [{ messageId: "no-inline-query" }],
    },
    {
      code: `const users = useQuery({ ...queryOptions, queryFn: () => {} })`,
      errors: [{ messageId: "no-inline-query" }],
    },
  ],
});
