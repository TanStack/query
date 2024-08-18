import { RuleTester } from '@typescript-eslint/rule-tester'
import {
  reactHookNames,
  rule,
} from '../rules/no-mutation-in-deps/no-mutation-in-deps.rule'

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  settings: {},
})

const baseTestCases = {
  valid: (importStatement: string, hookInvocation: string) => ({
    name: `should pass when destructured mutate is passed to useCallback as dependency - ${importStatement} - ${hookInvocation}`,
    code: `
            ${importStatement}
            import { useMutation } from "@tanstack/react-query";

            function Component() {
                const { mutate } = useMutation({ mutationFn: (value: string) => value });
                const callback = ${hookInvocation}(() => { mutate('hello') }, [mutate]);
                return;
            }
              `,
  }),
  invalid: (importStatement: string, hookInvocation: string) => ({
    name: `result of useMutation is passed to useCallback as dependency - ${importStatement} - ${hookInvocation}`,
    code: `
            ${importStatement}
            import { useMutation } from "@tanstack/react-query";
    
            function Component() {
              const mutation = useMutation({ mutationFn: (value: string) => value });
              const callback = ${hookInvocation}(() => { mutation.mutate('hello') }, [mutation]);
              return;
            }
          `,
    errors: [{ messageId: 'mutationInDeps' }],
  }),
}

const testCases = (hook: string) => [
  {
    importStatement: 'import * as React from "React";',
    hookInvocation: `React.${hook}`,
  },
  {
    importStatement: `import { ${hook} } from "React";`,
    hookInvocation: hook,
  },
  {
    importStatement: `import { ${hook} as useAlias } from "React";`,
    hookInvocation: 'useAlias',
  },
]

reactHookNames.forEach((hookName) => {
  testCases(hookName).forEach(({ importStatement, hookInvocation }) => {
    ruleTester.run('no-mutation-in-deps', rule, {
      valid: [baseTestCases.valid(importStatement, hookInvocation)],
      invalid: [baseTestCases.invalid(importStatement, hookInvocation)],
    })
  })
})
