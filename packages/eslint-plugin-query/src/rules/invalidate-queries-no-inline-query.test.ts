import "../_test/setup.js";

import { RuleTester } from "@typescript-eslint/rule-tester";

import requireQueryOptions from "./invalidate-queries-no-inline-query.js";

const ruleTester = new RuleTester({});

ruleTester.run(requireQueryOptions.name, requireQueryOptions.rule, {
  valid: [
    { code: `queryClient.invalidateQueries(usersQuery)` },
    { code: `queryClient.invalidateQueries({ ...usersQuery })` },
    { code: `queryClient.invalidateQueries({ ...usersQuery() })` },
  ],
  invalid: [
    {
      code: `queryClient.invalidateQueries({ queryKey: [] })`,
      errors: [{ messageId: "no-inline-query" }],
    },
    {
      code: `queryClient.invalidateQueries({ ...queryOptions, queryKey: [] })`,
      errors: [{ messageId: "no-inline-query" }],
    },
    {
      code: `queryClient.invalidateQueries({ queryFn: () => {} })`,
      errors: [{ messageId: "no-inline-query" }],
    },
    {
      code: `queryClient.invalidateQueries({ ...queryOptions, queryFn: () => {} })`,
      errors: [{ messageId: "no-inline-query" }],
    },
  ],
});
