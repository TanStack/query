import { RuleTester } from '@typescript-eslint/rule-tester'
import {
  reactHookNames,
  rule,
  useQueryHookNames,
} from '../rules/no-unstable-deps/no-unstable-deps.rule'

const ruleTester = new RuleTester()

interface TestCase {
  reactHookImport: string
  reactHookInvocation: string
  reactHookAlias: string
}
const baseTestCases = {
  valid: ({ reactHookImport, reactHookInvocation, reactHookAlias }: TestCase) =>
    [
      {
        name: `should pass when destructured mutate is passed to ${reactHookAlias} as dependency`,
        code: `
            ${reactHookImport}
            import { useMutation } from "@tanstack/react-query";

            function Component() {
                const { mutate } = useMutation({ mutationFn: (value: string) => value });
                const callback = ${reactHookInvocation}(() => { mutate('hello') }, [mutate]);
                return;
            }
              `,
      },
    ].concat(
      useQueryHookNames.map((queryHook) => ({
        name: `should pass result of ${queryHook} is passed to ${reactHookInvocation} as dependency`,
        code: `
            ${reactHookImport}
            import { ${queryHook} } from "@tanstack/react-query";

            function Component() {
              const { refetch } = ${queryHook}({ queryFn: (value: string) => value });
              const callback = ${reactHookInvocation}(() => { query.refetch() }, [refetch]);
              return;
            }
          `,
      })),
    ).concat([
      {
        name: `should pass when useQueries with combine is passed to ${reactHookAlias} as dependency`,
        code: `
            ${reactHookImport}
            import { useQueries } from "@tanstack/react-query";

            function Component() {
              const queries = useQueries({
                queries: [
                  { queryKey: ['test'], queryFn: () => 'test' }
                ],
                combine: (results) => ({ data: results[0]?.data })
              });
              const callback = ${reactHookInvocation}(() => { queries.data }, [queries]);
              return;
            }
          `,
      },
    ]),
  invalid: ({
    reactHookImport,
    reactHookInvocation,
    reactHookAlias,
  }: TestCase) =>
    [
      {
        name: `result of useMutation is passed to ${reactHookInvocation} as dependency `,
        code: `
            ${reactHookImport}
            import { useMutation } from "@tanstack/react-query";

            function Component() {
              const mutation = useMutation({ mutationFn: (value: string) => value });
              const callback = ${reactHookInvocation}(() => { mutation.mutate('hello') }, [mutation]);
              return;
            }
          `,
        errors: [
          {
            messageId: 'noUnstableDeps',
            data: { reactHook: reactHookAlias, queryHook: 'useMutation' },
          },
        ],
      },
    ].concat(
      useQueryHookNames.map((queryHook) => ({
        name: `result of ${queryHook} is passed to ${reactHookInvocation} as dependency`,
        code: `
            ${reactHookImport}
            import { ${queryHook} } from "@tanstack/react-query";

            function Component() {
              const query = ${queryHook}({ queryFn: (value: string) => value });
              const callback = ${reactHookInvocation}(() => { query.refetch() }, [query]);
              return;
            }
          `,
        errors: [
          {
            messageId: 'noUnstableDeps',
            data: { reactHook: reactHookAlias, queryHook },
          },
        ],
      })),
    ).concat([
      {
        name: `result of useQueries without combine is passed to ${reactHookInvocation} as dependency`,
        code: `
            ${reactHookImport}
            import { useQueries } from "@tanstack/react-query";

            function Component() {
              const queries = useQueries({
                queries: [
                  { queryKey: ['test'], queryFn: () => 'test' }
                ]
              });
              const callback = ${reactHookInvocation}(() => { queries[0]?.data }, [queries]);
              return;
            }
          `,
        errors: [
          {
            messageId: 'noUnstableDeps',
            data: { reactHook: reactHookAlias, queryHook: 'useQueries' },
          },
        ],
      },
    ]),
}

const testCases = (reactHookName: string) => [
  {
    reactHookImport: 'import * as React from "React";',
    reactHookInvocation: `React.${reactHookName}`,
    reactHookAlias: reactHookName,
  },
  {
    reactHookImport: `import { ${reactHookName} } from "React";`,
    reactHookInvocation: reactHookName,
    reactHookAlias: reactHookName,
  },
  {
    reactHookImport: `import { ${reactHookName} as useAlias } from "React";`,
    reactHookInvocation: 'useAlias',
    reactHookAlias: 'useAlias',
  },
]

reactHookNames.forEach((reactHookName) => {
  testCases(reactHookName).forEach(
    ({ reactHookInvocation, reactHookAlias, reactHookImport }) => {
      ruleTester.run('no-unstable-deps', rule, {
        valid: baseTestCases.valid({
          reactHookImport,
          reactHookInvocation,
          reactHookAlias,
        }),
        invalid: baseTestCases.invalid({
          reactHookImport,
          reactHookInvocation,
          reactHookAlias,
        }),
      })
    },
  )
})
