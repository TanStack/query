import { RuleTester } from '@typescript-eslint/rule-tester'
import { rule } from '../rules/no-rest-destructuring/no-rest-destructuring.rule'
import { normalizeIndent } from './test-utils'

const ruleTester = new RuleTester()

ruleTester.run('no-rest-destructuring', rule, {
  valid: [
    {
      name: 'useQuery is not captured',
      code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          useQuery()
          return
        }
      `,
    },
    {
      name: 'useQuery is not destructured',
      code: normalizeIndent`
          import { useQuery } from '@tanstack/react-query'

          function Component() {
            const query = useQuery()
            return
          }
        `,
    },
    {
      name: 'useQuery is destructured without rest',
      code: normalizeIndent`
          import { useQuery } from '@tanstack/react-query'

          function Component() {
            const { data, isLoading, isError } = useQuery()
            return
          }
        `,
    },
    {
      name: 'useInfiniteQuery is not captured',
      code: normalizeIndent`
        import { useInfiniteQuery } from '@tanstack/react-query'

        function Component() {
          useInfiniteQuery()
          return
        }
      `,
    },
    {
      name: 'useInfiniteQuery is not destructured',
      code: normalizeIndent`
          import { useInfiniteQuery } from '@tanstack/react-query'

          function Component() {
            const query = useInfiniteQuery()
            return
          }
        `,
    },
    {
      name: 'useInfiniteQuery is destructured without rest',
      code: normalizeIndent`
          import { useInfiniteQuery } from '@tanstack/react-query'

          function Component() {
            const { data, isLoading, isError } = useInfiniteQuery()
            return
          }
        `,
    },
    {
      name: 'useQueries is not captured',
      code: normalizeIndent`
        import { useQueries } from '@tanstack/react-query'

        function Component() {
          useQueries([])
          return
        }
      `,
    },
    {
      name: 'useQueries is not destructured',
      code: normalizeIndent`
          import { useQueries } from '@tanstack/react-query'

          function Component() {
            const queries = useQueries([])
            return
          }
        `,
    },
    {
      name: 'useQueries array has no rest destructured element',
      code: normalizeIndent`
          import { useQueries } from '@tanstack/react-query'

          function Component() {
            const [query1, { data, isLoading },, ...others] = useQueries([
              { queryKey: ['key1'], queryFn: () => {} },
              { queryKey: ['key2'], queryFn: () => {} },
              { queryKey: ['key3'], queryFn: () => {} },
              { queryKey: ['key4'], queryFn: () => {} },
              { queryKey: ['key5'], queryFn: () => {} },
            ])
            return
          }
        `,
    },
    {
      name: 'useQuery is destructured with rest but not from tanstack query',
      code: normalizeIndent`
        import { useQuery } from 'other-package'

        function Component() {
          const { data, ...rest } = useQuery()
          return
        }
      `,
    },
    {
      name: 'useInfiniteQuery is destructured with rest but not from tanstack query',
      code: normalizeIndent`
        import { useInfiniteQuery } from 'other-package'

        function Component() {
          const { data, ...rest } = useInfiniteQuery()
          return
        }
      `,
    },
    {
      name: 'useQueries array has rest destructured element but not from tanstack query',
      code: normalizeIndent`
          import { useQueries } from 'other-package'

          function Component() {
            const [query1, { data, ...rest }] = useQueries([
              { queryKey: ['key1'], queryFn: () => {} },
              { queryKey: ['key2'], queryFn: () => {} },
            ])
            return
          }
        `,
    },
    {
      name: 'useSuspenseQuery is not captured',
      code: normalizeIndent`
        import { useSuspenseQuery } from '@tanstack/react-query'

        function Component() {
          useSuspenseQuery()
          return
        }
      `,
    },
    {
      name: 'useSuspenseQuery is not destructured',
      code: normalizeIndent`
        import { useSuspenseQuery } from '@tanstack/react-query'

        function Component() {
          const query = useSuspenseQuery()
          return
        }
      `,
    },
    {
      name: 'useSuspenseQuery is destructured without rest',
      code: normalizeIndent`
        import { useSuspenseQuery } from '@tanstack/react-query'

        function Component() {
          const { data, isLoading, isError } = useSuspenseQuery()
          return
        }
      `,
    },
    {
      name: 'useSuspenseInfiniteQuery is not captured',
      code: normalizeIndent`
        import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

        function Component() {
          useSuspenseInfiniteQuery()
          return
        }
      `,
    },
    {
      name: 'useSuspenseInfiniteQuery is not destructured',
      code: normalizeIndent`
        import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

        function Component() {
          const query = useSuspenseInfiniteQuery()
          return
        }
      `,
    },
    {
      name: 'useSuspenseInfiniteQuery is destructured without rest',
      code: normalizeIndent`
        import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

        function Component() {
          const { data, isLoading, isError } = useSuspenseInfiniteQuery()
          return
        }
      `,
    },
    {
      name: 'useSuspenseQueries is not captured',
      code: normalizeIndent`
        import { useSuspenseQueries } from '@tanstack/react-query'

        function Component() {
          useSuspenseQueries([])
          return
        }
      `,
    },
    {
      name: 'useSuspenseQueries is not destructured',
      code: normalizeIndent`
        import { useSuspenseQueries } from '@tanstack/react-query'

        function Component() {
          const queries = useSuspenseQueries([])
          return
        }
      `,
    },
    {
      name: 'useSuspenseQueries array has no rest destructured element',
      code: normalizeIndent`
        import { useSuspenseQueries } from '@tanstack/react-query'

        function Component() {
          const [query1, { data, isLoading }] = useSuspenseQueries([
            { queryKey: ['key1'], queryFn: () => {} },
            { queryKey: ['key2'], queryFn: () => {} },
          ])
          return
        }
      `,
    },
    {
      name: 'useSuspenseQuery is destructured with rest but not from tanstack query',
      code: normalizeIndent`
        import { useSuspenseQuery } from 'other-package'

        function Component() {
          const { data, ...rest } = useSuspenseQuery()
          return
        }
      `,
    },
    {
      name: 'useSuspenseInfiniteQuery is destructured with rest but not from tanstack query',
      code: normalizeIndent`
        import { useSuspenseInfiniteQuery } from 'other-package'

        function Component() {
          const { data, ...rest } = useSuspenseInfiniteQuery()
          return
        }
      `,
    },
    {
      name: 'useSuspenseQueries array has rest destructured element but not from tanstack query',
      code: normalizeIndent`
        import { useSuspenseQueries } from 'other-package'

        function Component() {
          const [query1, { data, ...rest }] = useSuspenseQueries([
            { queryKey: ['key1'], queryFn: () => {} },
            { queryKey: ['key2'], queryFn: () => {} },
          ])
          return
        }
      `,
    },
  ],
  invalid: [
    {
      name: 'useQuery is destructured with rest',
      code: normalizeIndent`
        import { useQuery } from '@tanstack/react-query'

        function Component() {
          const { data, ...rest } = useQuery()
          return
        }
      `,
      errors: [{ messageId: 'objectRestDestructure' }],
    },
    {
      name: 'useInfiniteQuery is destructured with rest',
      code: normalizeIndent`
        import { useInfiniteQuery } from '@tanstack/react-query'

        function Component() {
          const { data, ...rest } = useInfiniteQuery()
          return
        }
      `,
      errors: [{ messageId: 'objectRestDestructure' }],
    },
    {
      name: 'useQueries array has rest destructured element',
      code: normalizeIndent`
          import { useQueries } from '@tanstack/react-query'

          function Component() {
            const [query1, { data, ...rest }] = useQueries([
              { queryKey: ['key1'], queryFn: () => {} },
              { queryKey: ['key2'], queryFn: () => {} },
            ])
            return
          }
        `,
      errors: [{ messageId: 'objectRestDestructure' }],
    },
    {
      name: 'useSuspenseQuery is destructured with rest',
      code: normalizeIndent`
        import { useSuspenseQuery } from '@tanstack/react-query'

        function Component() {
          const { data, ...rest } = useSuspenseQuery()
          return
        }
      `,
      errors: [{ messageId: 'objectRestDestructure' }],
    },
    {
      name: 'useSuspenseInfiniteQuery is destructured with rest',
      code: normalizeIndent`
        import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

        function Component() {
          const { data, ...rest } = useSuspenseInfiniteQuery()
          return
        }
      `,
      errors: [{ messageId: 'objectRestDestructure' }],
    },
    {
      name: 'useSuspenseQueries is destructured with rest',
      code: normalizeIndent`
        import { useSuspenseQueries } from '@tanstack/react-query'

        function Component() {
          const [query1, { data, ...rest }] = useSuspenseQueries([
            { queryKey: ['key1'], queryFn: () => {} },
            { queryKey: ['key2'], queryFn: () => {} },
          ])
          return
        }
      `,
      errors: [{ messageId: 'objectRestDestructure' }],
    },
  ],
})
