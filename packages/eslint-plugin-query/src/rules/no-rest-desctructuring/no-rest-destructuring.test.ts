import { ESLintUtils } from '@typescript-eslint/utils'
import { normalizeIndent } from '../../utils/test-utils'
import { rule } from './no-rest-destructuring.rule'

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  settings: {},
})

ruleTester.run('no-rest-desctructuring', rule, {
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
  ],
})
