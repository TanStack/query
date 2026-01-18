import path from 'node:path'
import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { rule } from '../rules/no-void-query-fn/no-void-query-fn.rule'
import { normalizeIndent } from './test-utils'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({
  languageOptions: {
    parser: await import('@typescript-eslint/parser'),
    parserOptions: {
      project: true,
      tsconfigRootDir: path.resolve(__dirname, './ts-fixture'),
    },
  },
})

ruleTester.run('no-void-query-fn', rule, {
    valid: [
      {
        name: 'queryFn returns a value',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => ({ data: 'test' }),
          })
          return null
        }
      `,
      },
      {
        name: 'queryFn returns a Promise',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: async () => ({ data: 'test' }),
          })
          return null
        }
      `,
      },
      {
        name: 'queryFn returns Promise.resolve',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => Promise.resolve({ data: 'test' }),
          })
          return null
        }
      `,
      },
      {
        name: 'queryFn with explicit Promise type',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        interface Data {
          value: string
        }

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: async (): Promise<Data> => {
              return { value: 'test' }
            },
          })
          return null
        }
      `,
      },
      {
        name: 'queryFn with generic Promise type',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        interface Response<T> {
          data: T
        }

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: async (): Promise<Response<string>> => {
              return { data: 'test' }
            },
          })
          return null
        }
      `,
      },
      {
        name: 'queryFn with external async function',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        async function fetchData(): Promise<{ data: string }> {
          return { data: 'test' }
        }

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: fetchData,
          })
          return null
        }
      `,
      },
      {
        name: 'queryFn returns null',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => null,
          })
          return null
        }
      `,
      },
      {
        name: 'queryFn returns 0',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => 0,
          })
          return null
        }
      `,
      },
      {
        name: 'queryFn returns false',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => false,
          })
          return null
        }
      `,
      },
    ],
    invalid: [
      {
        name: 'queryFn returns void',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => {
              console.log('test')
            },
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
      {
        name: 'queryFn returns undefined',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => undefined,
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
      {
        name: 'async queryFn returns void',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: async () => {
              await someOperation()
            },
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
      {
        name: 'queryFn with explicit void Promise',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: async (): Promise<void> => {
              await someOperation()
            },
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
      {
        name: 'queryFn with Promise.resolve(undefined)',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => Promise.resolve(undefined),
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
      {
        name: 'queryFn with external void async function',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        async function voidOperation(): Promise<void> {
          await someOperation()
        }

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: voidOperation,
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
      {
        name: 'queryFn with conditional return (one branch missing)',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => {
              if (Math.random() > 0.5) {
                return { data: 'test' }
              }
              // Missing return in the else case
            },
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
      {
        name: 'queryFn with ternary operator returning undefined',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: () => Math.random() > 0.5 ? { data: 'test' } : undefined,
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
      {
        name: 'async queryFn with try/catch missing return in catch',
        code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const query = useQuery({
            queryKey: ['test'],
            queryFn: async () => {
              try {
                return { data: 'test' }
              } catch (error) {
                console.error(error)
                // No return here results in an implicit undefined
              }
            },
          })
          return null
        }
      `,
        errors: [{ messageId: 'noVoidReturn' }],
      },
    ],
  },
)
