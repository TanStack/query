import { RuleTester } from '@typescript-eslint/rule-tester'
import { afterAll, describe, it } from 'vitest'
import { rule } from '../rules/prefer-query-options/prefer-query-options.rule'
import { normalizeIndent } from './test-utils'

RuleTester.afterAll = afterAll
RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester()

describe('prefer-query-options', () => {
  describe('queryOptions / infiniteQueryOptions builders', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [
        {
          name: 'queryOptions builder is allowed',
          code: normalizeIndent`
            import { queryOptions } from '@tanstack/react-query'

            const todosOptions = queryOptions({
              queryKey: ['todos'],
              queryFn: () => fetchTodos(),
            })
          `,
        },
        {
          name: 'infiniteQueryOptions builder is allowed',
          code: normalizeIndent`
            import { infiniteQueryOptions } from '@tanstack/react-query'

            const todosOptions = infiniteQueryOptions({
              queryKey: ['todos'],
              queryFn: ({ pageParam }) => fetchTodos(pageParam),
              initialPageParam: 0,
              getNextPageParam: (lastPage) => lastPage.nextCursor,
            })
          `,
        },
      ],
      invalid: [],
    })
  })

  describe('hooks consuming queryOptions result', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [
        {
          name: 'useQuery with queryOptions result is allowed',
          code: normalizeIndent`
            import { useQuery, queryOptions } from '@tanstack/react-query'

            const todosOptions = queryOptions({
              queryKey: ['todos'],
              queryFn: () => fetchTodos(),
            })

            function Component() {
              const query = useQuery(todosOptions)
              return null
            }
          `,
        },
        {
          name: 'useQuery with queryOptions function call result is allowed',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            function Component({ id }) {
              const query = useQuery(todosOptions(id))
              return null
            }
          `,
        },
        {
          name: 'useQuery with imported queryOptions function call is allowed',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'
            import { getFooOptions } from './foo'

            function Component({ id }) {
              const query = useQuery(getFooOptions(id))
              return null
            }
          `,
        },
        {
          name: 'useQuery spreading queryOptions result is allowed',
          code: normalizeIndent`
            import { useQuery, queryOptions } from '@tanstack/react-query'

            const todosOptions = queryOptions({
              queryKey: ['todos'],
              queryFn: () => fetchTodos(),
            })

            function Component() {
              const query = useQuery({ ...todosOptions, select: (data) => data.items })
              return null
            }
          `,
        },
        {
          name: 'useQuery spreading queryOptions function call result is allowed',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            function Component({ id }) {
              const query = useQuery({ ...todosOptions(id), select: (data) => data.items })
              return null
            }
          `,
        },
        {
          name: 'useQueries with all entries from queryOptions is allowed',
          code: normalizeIndent`
            import { useQueries } from '@tanstack/react-query'

            function Component() {
              const queries = useQueries({
                queries: [todosOptions, usersOptions],
              })
              return null
            }
          `,
        },
      ],
      invalid: [],
    })
  })

  describe('queryClient methods referencing queryKey from options', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [
        {
          name: 'queryClient.getQueryData with options.queryKey is allowed',
          code: normalizeIndent`
            import { useQueryClient, queryOptions } from '@tanstack/react-query'

            const todosOptions = queryOptions({
              queryKey: ['todos'],
              queryFn: () => fetchTodos(),
            })

            function Component() {
              const queryClient = useQueryClient()
              const data = queryClient.getQueryData(todosOptions.queryKey)
              return null
            }
          `,
        },
        {
          name: 'queryClient.setQueryData with options.queryKey is allowed',
          code: normalizeIndent`
            import { useQueryClient, queryOptions } from '@tanstack/react-query'

            const todosOptions = queryOptions({
              queryKey: ['todos'],
              queryFn: () => fetchTodos(),
            })

            function Component() {
              const queryClient = useQueryClient()
              queryClient.setQueryData(todosOptions.queryKey, [])
              return null
            }
          `,
        },
        {
          name: 'queryClient.invalidateQueries with options.queryKey is allowed',
          code: normalizeIndent`
            import { useQueryClient, queryOptions } from '@tanstack/react-query'

            const todosOptions = queryOptions({
              queryKey: ['todos'],
              queryFn: () => fetchTodos(),
            })

            function Component() {
              const queryClient = useQueryClient()
              queryClient.invalidateQueries({ queryKey: todosOptions.queryKey })
              return null
            }
          `,
        },
        {
          name: 'queryClient.invalidateQueries with options.queryKey and extra filter props is allowed',
          code: normalizeIndent`
            import { useQueryClient, queryOptions } from '@tanstack/react-query'

            const todosOptions = queryOptions({
              queryKey: ['todos'],
              queryFn: () => fetchTodos(),
            })

            function Component() {
              const queryClient = useQueryClient()
              queryClient.invalidateQueries({ queryKey: todosOptions.queryKey, exact: true })
              return null
            }
          `,
        },
        {
          name: 'queryClient.getQueryData with variable queryKey is allowed',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component({ queryKey }) {
              const queryClient = useQueryClient()
              const data = queryClient.getQueryData(queryKey)
              return null
            }
          `,
        },
        {
          name: 'shadowed queryClient parameter is ignored',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()

              function run(queryClient) {
                queryClient.fetchQuery({
                  queryKey: ['todos'],
                  queryFn: () => fetchTodos(),
                })
              }

              return null
            }
          `,
        },
        {
          name: 'non-queryClient fetchQuery call is ignored',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            const analytics = {
              fetchQuery(options) {
                return options
              },
            }

            function Component() {
              useQuery(todosOptions)

              analytics.fetchQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })

              return null
            }
          `,
        },
      ],
      invalid: [],
    })
  })

  describe('non-tanstack imports', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [
        {
          name: 'non-tanstack useQuery is ignored',
          code: normalizeIndent`
            import { useQuery } from 'other-library'

            function Component() {
              const query = useQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
        },
      ],
      invalid: [],
    })
  })

  describe('inline lone queryKey or queryFn in hooks', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [],
      invalid: [
        {
          name: 'useQuery with only inline queryKey (no queryFn)',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            function Component() {
              const query = useQuery({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useQuery with only inline queryFn (no queryKey)',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            function Component() {
              const query = useQuery({ queryFn: () => fetchTodos() })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
      ],
    })
  })

  describe('spread with inline queryKey or queryFn override in hooks', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [],
      invalid: [
        {
          name: 'useQuery spreading options but overriding queryKey inline',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            function Component() {
              const query = useQuery({ ...options, queryKey: ['override'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useQuery spreading options but overriding queryFn inline',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            function Component() {
              const query = useQuery({ ...options, queryFn: () => fetchOverride() })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
      ],
    })
  })

  describe('inline queryKey + queryFn in hooks', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [],
      invalid: [
        {
          name: 'useQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            function Component() {
              const query = useQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'aliased useQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQuery as useTanstackQuery } from '@tanstack/react-query'

            function Component() {
              const query = useTanstackQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useInfiniteQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useInfiniteQuery } from '@tanstack/react-query'

            function Component() {
              const query = useInfiniteQuery({
                queryKey: ['todos'],
                queryFn: ({ pageParam }) => fetchTodos(pageParam),
                initialPageParam: 0,
                getNextPageParam: (lastPage) => lastPage.nextCursor,
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useSuspenseQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useSuspenseQuery } from '@tanstack/react-query'

            function Component() {
              const query = useSuspenseQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useSuspenseInfiniteQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

            function Component() {
              const query = useSuspenseInfiniteQuery({
                queryKey: ['todos'],
                queryFn: ({ pageParam }) => fetchTodos(pageParam),
                initialPageParam: 0,
                getNextPageParam: (lastPage) => lastPage.nextCursor,
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useQueries with inline queryKey + queryFn in queries array',
          code: normalizeIndent`
            import { useQueries } from '@tanstack/react-query'

            function Component() {
              const queries = useQueries({
                queries: [
                  {
                    queryKey: ['todos'],
                    queryFn: () => fetchTodos(),
                  },
                ],
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useQueries with multiple inline entries reports multiple errors',
          code: normalizeIndent`
            import { useQueries } from '@tanstack/react-query'

            function Component() {
              const queries = useQueries({
                queries: [
                  {
                    queryKey: ['todos'],
                    queryFn: () => fetchTodos(),
                  },
                  {
                    queryKey: ['users'],
                    queryFn: () => fetchUsers(),
                  },
                ],
              })
              return null
            }
          `,
          errors: [
            { messageId: 'preferQueryOptions' },
            { messageId: 'preferQueryOptions' },
          ],
        },
        {
          name: 'useQueries with mapped inline query objects',
          code: normalizeIndent`
            import { useQueries } from '@tanstack/react-query'

            function Component({ ids }) {
              const queries = useQueries({
                queries: ids.map((id) => ({
                  queryKey: ['todos', id],
                  queryFn: () => fetchTodo(id),
                })),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useSuspenseQueries with inline queryKey + queryFn in queries array',
          code: normalizeIndent`
            import { useSuspenseQueries } from '@tanstack/react-query'

            function Component() {
              const queries = useSuspenseQueries({
                queries: [
                  {
                    queryKey: ['todos'],
                    queryFn: () => fetchTodos(),
                  },
                ],
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'useSuspenseQueries with mapped inline query objects',
          code: normalizeIndent`
            import { useSuspenseQueries } from '@tanstack/react-query'

            function Component({ ids }) {
              const queries = useSuspenseQueries({
                queries: ids.map((id) => ({
                  queryKey: ['todos', id],
                  queryFn: () => fetchTodo(id),
                })),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'usePrefetchQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { usePrefetchQuery } from '@tanstack/react-query'

            function Component() {
              usePrefetchQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'usePrefetchInfiniteQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { usePrefetchInfiniteQuery } from '@tanstack/react-query'

            function Component() {
              usePrefetchInfiniteQuery({
                queryKey: ['todos'],
                queryFn: ({ pageParam }) => fetchTodos(pageParam),
                initialPageParam: 0,
                getNextPageParam: (lastPage) => lastPage.nextCursor,
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'inline queryKey + queryFn inside a custom hook',
          code: normalizeIndent`
            import { useQuery } from '@tanstack/react-query'

            function useTodos() {
              return useQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
      ],
    })
  })

  describe('queryClient with alternate variable names', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [],
      invalid: [
        {
          name: 'client.fetchQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const client = useQueryClient()
              client.fetchQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'aliased useQueryClient tracks query client variables',
          code: normalizeIndent`
            import { useQueryClient as getClient } from '@tanstack/react-query'

            function Component() {
              const client = getClient()
              client.fetchQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'aliased QueryClient tracks query client instances',
          code: normalizeIndent`
            import { QueryClient as Client } from '@tanstack/react-query'

            const queryClient = new Client()

            queryClient.fetchQuery({
              queryKey: ['todos'],
              queryFn: () => fetchTodos(),
            })
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'qc.getQueryData with inline queryKey',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const qc = useQueryClient()
              const data = qc.getQueryData(['todos'])
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'client.invalidateQueries with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const client = useQueryClient()
              client.invalidateQueries({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
      ],
    })
  })

  describe('inline queryKey + queryFn in queryClient methods', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [],
      invalid: [
        {
          name: 'queryClient.fetchQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.fetchQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'queryClient.prefetchQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.prefetchQuery({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'queryClient.fetchInfiniteQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.fetchInfiniteQuery({
                queryKey: ['todos'],
                queryFn: ({ pageParam }) => fetchTodos(pageParam),
                initialPageParam: 0,
                getNextPageParam: (lastPage) => lastPage.nextCursor,
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'queryClient.prefetchInfiniteQuery with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.prefetchInfiniteQuery({
                queryKey: ['todos'],
                queryFn: ({ pageParam }) => fetchTodos(pageParam),
                initialPageParam: 0,
                getNextPageParam: (lastPage) => lastPage.nextCursor,
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'queryClient.ensureQueryData with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.ensureQueryData({
                queryKey: ['todos'],
                queryFn: () => fetchTodos(),
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
        {
          name: 'queryClient.ensureInfiniteQueryData with inline queryKey + queryFn',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.ensureInfiniteQueryData({
                queryKey: ['todos'],
                queryFn: ({ pageParam }) => fetchTodos(pageParam),
                initialPageParam: 0,
                getNextPageParam: (lastPage) => lastPage.nextCursor,
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptions' }],
        },
      ],
    })
  })

  describe('inline queryKey as direct parameter', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [],
      invalid: [
        {
          name: 'queryClient.getQueryData with inline queryKey',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              const data = queryClient.getQueryData(['todos'])
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.getQueryData with inline queryKey as const',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              const data = queryClient.getQueryData(['todos'] as const)
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.getQueryData with inline queryKey satisfies',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              const data = queryClient.getQueryData((['todos']) satisfies readonly string[])
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.setQueryData with inline queryKey',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.setQueryData(['todos'], [])
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.getQueryState with inline queryKey',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              const state = queryClient.getQueryState(['todos'])
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.setQueryDefaults with inline queryKey',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.setQueryDefaults(['todos'], { staleTime: 1000 })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.getQueryDefaults with inline queryKey',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              const defaults = queryClient.getQueryDefaults(['todos'])
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
      ],
    })
  })

  describe('inline queryKey in filter objects', () => {
    ruleTester.run('prefer-query-options', rule, {
      valid: [],
      invalid: [
        {
          name: 'queryClient.invalidateQueries with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.invalidateQueries({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.invalidateQueries with inline queryKey as const in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.invalidateQueries({ queryKey: ['todos'] as const })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.invalidateQueries with inline queryKey satisfies in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.invalidateQueries({
                queryKey: (['todos']) satisfies readonly string[],
              })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.cancelQueries with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.cancelQueries({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.refetchQueries with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.refetchQueries({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.removeQueries with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.removeQueries({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.resetQueries with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.resetQueries({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.isFetching with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              const count = queryClient.isFetching({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.getQueriesData with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              const data = queryClient.getQueriesData({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'queryClient.setQueriesData with inline queryKey in filters',
          code: normalizeIndent`
            import { useQueryClient } from '@tanstack/react-query'

            function Component() {
              const queryClient = useQueryClient()
              queryClient.setQueriesData({ queryKey: ['todos'] }, [])
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
        {
          name: 'useIsFetching with inline queryKey in filters',
          code: normalizeIndent`
            import { useIsFetching } from '@tanstack/react-query'

            function Component() {
              const count = useIsFetching({ queryKey: ['todos'] })
              return null
            }
          `,
          errors: [{ messageId: 'preferQueryOptionsQueryKey' }],
        },
      ],
    })
  })
})
