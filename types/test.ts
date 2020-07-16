import {
  ReactQueryProviderConfig,
  setConsole,
  useInfiniteQuery,
  useIsFetching,
  useMutation,
  usePaginatedQuery,
  useQuery,
  queryCache,
  CachedQuery,
} from 'react-query'

class FooError extends Error {}

function resetErrorBoundaries() {
  queryCache.resetErrorBoundaries // $ExpectType () => void
}

function prefetchQuery() {
  queryCache.prefetchQuery('queryKey', (key: string) => Promise.resolve())
  queryCache.prefetchQuery('queryKey', (key: string) => Promise.resolve(), {
    retry: 1,
  })
  queryCache.prefetchQuery<number, string, FooError>(
    'queryKey',
    (key: string) =>
      Math.random() > 0.5
        ? Promise.reject(new FooError())
        : Promise.resolve(123),
    { onError: a => false },
    { throwOnError: false }
  )
  queryCache.prefetchQuery('queryKey', (key: string) => Promise.resolve(), {
    throwOnError: true,
  })
  queryCache.prefetchQuery(['queryKey'], (key: string) => Promise.resolve(), {
    throwOnError: true,
  })
}

function getQueryData() {
  queryCache.getQueryData(['queryKey']);
  queryCache.getQueryData('queryKey');
  queryCache.getQueryData(true);
  queryCache.getQueryData((query) => true);
}

function setQueryData() {
  queryCache.setQueryData(['queryKey'], ['data']);
  queryCache.setQueryData('queryKey', ['data']);
  queryCache.setQueryData(true, ['data']);
  queryCache.setQueryData((query) => true, ['data']);
}

function getQuery() {
  queryCache.getQuery(['queryKey']);
  queryCache.getQuery('queryKey');
  queryCache.getQuery(true);
  queryCache.getQuery((query) => true);
}

function getQueries() {
  queryCache.getQueries(['queryKey']);
  queryCache.getQueries('queryKey');
  queryCache.getQueries(true);
  queryCache.getQueries((query) => true);
}

function cachedQueryErrorState() {
  const query = queryCache.getQuery(['queryKey']) as CachedQuery<unknown, FooError>
  const error: FooError | null | undefined = query.state.error;
}

function simpleQuery() {
  // Query - simple case
  const querySimple = useQuery<string, 'todos'>('todos', () =>
    Promise.resolve('test')
  )
  querySimple.isFetchingMore // $ExpectError
  querySimple.fetchMore // $ExpectError

  querySimple.canFetchMore // $ExpectType boolean | undefined
  querySimple.clear // $ExpectType () => void
  querySimple.clear() // $ExpectType void
  querySimple.data // $ExpectType string | undefined
  querySimple.error // $ExpectType Error | null
  querySimple.failureCount // $ExpectType number
  querySimple.isError // $ExpectType boolean
  querySimple.isFetching // $ExpectType boolean
  querySimple.isIdle // $ExpectType boolean
  querySimple.isLoading // $ExpectType boolean
  querySimple.isStale // $ExpectType boolean
  querySimple.isSuccess // $ExpectType boolean
  querySimple.markedForGarbageCollection // $ExpectType boolean
  querySimple.query // $ExpectType object
  querySimple.refetch // $ExpectType ({ throwOnError }?: { throwOnError?: boolean | undefined; } | undefined) => Promise<string>
  querySimple.refetch() // $ExpectType Promise<string>
  querySimple.status // $ExpectType "idle" | "loading" | "error" | "success"
  querySimple.updatedAt // $ExpectType number
}

function queryWithVariables() {
  // Query Variables
  const param = 'test'
  const query = useQuery(['todos', { param }, 10], (key, variables, id) =>
    Promise.resolve(variables.param === 'test')
  )

  query.data // $ExpectType boolean | undefined
  query.refetch() // $ExpectType Promise<boolean>
}

function queryWithReadonlyArray() {
  useQuery(
    ['key', 'a'] as const,
    async (
      key, // $ExpectType "key"
      other // $ExpectType "a"
    ) => key
  )
}

function queryKeyArrayOrder() {
  // first element in the key must be not null/undefined
  useQuery([null, 'a'], async (key, other) => key) // $ExpectError

  useQuery([10, 'a'], async (key, other) => key)
  useQuery([false, 'a'], async (key, other) => key)
  useQuery([{ complex: { obj: 'yes' } }, 'a'], async (key, other) => key)
}

function conditionalQuery(condition: boolean) {
  const queryFn1 = (name: string, params: { bar: string }) =>
    Promise.resolve(10)
  const queryFn2 = () => Promise.resolve('test')

  useQuery(() => 'foo', queryFn2, { enabled: condition }) // $ExpectError

  // Query with falsey enabled
  useQuery(['foo', { bar: 'baz' }], queryFn1, { enabled: condition })
  useQuery(['foo', { bar: 'baz' }], queryFn2, { enabled: condition })
  useQuery({
    queryKey: ['foo', { bar: 'baz' }],
    queryFn: queryFn1,
    config: { enabled: condition },
  })
}

function queryWithoutFn() {
  useQuery('key')
  useQuery(['key'])

  useQuery('key', { suspense: false }) // with QueryOptions
  useQuery(['key'], { suspense: false }) // with QueryOptions

  useQuery({ queryKey: 'key' })
  useQuery({ queryKey: ['key'] })

  useQuery({ queryKey: 'key', config: { suspense: false } }) // with QueryOptions
  useQuery({ queryKey: ['key'], config: { suspense: false } }) // with QueryOptions
}

function queryWithObjectSyntax(condition: boolean) {
  useQuery({
    queryKey: ['key'],
    queryFn: async (
      key // $ExpectType string
    ) => key,
  }).data // $ExpectType string | undefined

  useQuery({
    queryKey: ['key', 10],
    queryFn: async (
      key, // $ExpectType string
      id // $ExpectType number
    ) => 'yay!',
  }).data // $ExpectType string | undefined

  useQuery({
    queryKey: 'key',
    queryFn: async (
      key // $ExpectType "key"
    ) => 'yay!',
  }).data // $ExpectType string | undefined

  useQuery({
    queryKey: 'key',
    queryFn: async (
      key // $ExpectType "key"
    ) => 10,
    config: { enabled: condition },
  }).data // $ExpectType number | undefined
}

function queryWithNestedKey() {
  // Query with nested variabes
  const queryNested = useQuery(['key', { nested: { props: [1, 2] } }], (
    key, // $ExpectType string
    variables // $ExpectType { nested: { props: number[]; }; }
  ) => Promise.resolve(variables.nested.props[0]))
  queryNested.data // $ExpectType number | undefined
}

function queryWithComplexKeysAndVariables() {
  useQuery(['key', { a: 1 }, { b: { x: 1 } }, { c: { x: 1 } }], (
    key1, // $ExpectType string
    key2, // ExpectType { a: number }
    var1, // $ExpectType { b: { x: number; }; }
    var2 // $ExpectType { c: { x: number; }; }
  ) =>
    Promise.resolve(
      key1 === 'key' && key2.a === 1 && var1.b.x === 1 && var2.c.x === 1
    )
  )

  // custom key
  const longKey: [string, ...number[]] = ['key', 1, 2, 3, 4, 5]
  useQuery(
    longKey,
    async (
      key, // $ExpectType string
      ...ids // $ExpectType number[]
    ) => 100
  ).data // $ExpectType number | undefined

  const longVariables = [true, {}, {}, {}] as const
  const queryFn = async (key: string, var1: boolean, ...vars: Array<{}>) => 100
  useQuery(['key', ...longVariables] as const, queryFn).data // $ExpectType number | undefined

  // the following example cannot work properly, as it would require concatenating tuples with infinite tails.
  // ts-toolbelt library's `List.Concat` cannot do the job. It would be possible to do with `typescript-tuple` and additional trick.
  // useQuery<number, typeof longKey, typeof longVariables>(longKey, longVariables, async (
  //     key,        // $ExpectType string // <-- currently boolean?!
  //     keyOrVar,   // $ExpectType number | boolean // <-- currently object
  //     ...rest     // $ExpectType number | object  // <-- currently object[]
  // ) => 100).data; // $ExpectType number | undefined
}

function paginatedQuery() {
  // Paginated mode
  const queryPaginated = usePaginatedQuery(
    'key',
    () => Promise.resolve({ data: [1, 2, 3], next: true }),
    {
      refetchInterval: 1000,
    }
  )
  queryPaginated.resolvedData // $ExpectType { data: number[]; next: boolean; } | undefined
  queryPaginated.latestData // $ExpectType { data: number[]; next: boolean; } | undefined
  queryPaginated.data // $ExpectError

  // Discriminated union over status
  if (queryPaginated.status === 'loading') {
    queryPaginated.resolvedData // $ExpectType { data: number[]; next: boolean; } | undefined
    queryPaginated.latestData // $ExpectType { data: number[]; next: boolean; } | undefined
    queryPaginated.error // $ExpectType Error | null
  }

  if (queryPaginated.status === 'error') {
    queryPaginated.resolvedData // $ExpectType { data: number[]; next: boolean; } | undefined
    queryPaginated.latestData // $ExpectType { data: number[]; next: boolean; } | undefined
    queryPaginated.error // $ExpectType Error
  }

  if (queryPaginated.status === 'success') {
    queryPaginated.resolvedData // $ExpectType { data: number[]; next: boolean; }
    queryPaginated.latestData // $ExpectType { data: number[]; next: boolean; }
    queryPaginated.error // $ExpectType null
  }

  // Discriminated union over status flags
  if (queryPaginated.isLoading) {
    queryPaginated.resolvedData // $ExpectType { data: number[]; next: boolean; } | undefined
    queryPaginated.latestData // $ExpectType { data: number[]; next: boolean; } | undefined
    queryPaginated.error // $ExpectType Error | null
  }

  if (queryPaginated.isError) {
    queryPaginated.resolvedData // $ExpectType { data: number[]; next: boolean; } | undefined
    queryPaginated.latestData // $ExpectType { data: number[]; next: boolean; } | undefined
    queryPaginated.error // $ExpectType Error
  }

  if (queryPaginated.isSuccess) {
    queryPaginated.resolvedData // $ExpectType { data: number[]; next: boolean; }
    queryPaginated.latestData // $ExpectType { data: number[]; next: boolean; }
    queryPaginated.error // $ExpectType null
  }
}

function paginatedQueryWithObjectSyntax() {
  usePaginatedQuery({
    queryKey: ['key', { a: 10 }],
    queryFn: async (key, { a }) => (key === 'key' && a === 10 ? 'yes' : 'no'),
  }).latestData // $ExpectType "yes" | "no" | undefined
  usePaginatedQuery({
    queryKey: 'key',
    queryFn: async key => (key === 'key' ? 'yes' : 'no'),
  }).latestData // $ExpectType "yes" | "no" | undefined
  usePaginatedQuery({
    queryKey: 'key',
    queryFn: async key => (key === 'key' ? 'yes' : 'no'),
  }).latestData // $ExpectType "yes" | "no" | undefined
}

function simpleInfiniteQuery(condition: boolean) {
  async function fetchWithCursor(key: string, cursor?: string) {
    return [1, 2, 3]
  }
  function getFetchMore(last: number[], all: number[][]) {
    return last.length ? String(all.length + 1) : false
  }

  useInfiniteQuery<number[], [string], string>(['key'], fetchWithCursor, {
    getFetchMore: (
      last, // $ExpectType number[]
      all // $ExpectType number[][]
    ) => 'next',
    // type of data in success is the array of results
    onSuccess(
      data // $ExpectType number[][]
    ) {},
    onSettled(
      data, // $ExpectType number[][] | undefined
      error // $ExpectType Error | null
    ) {},
    initialData: () =>
      condition
        ? [
            [1, 2],
            [2, 3],
          ]
        : undefined,
  })
  useInfiniteQuery(['key'], fetchWithCursor, { getFetchMore })
  useInfiniteQuery('key', fetchWithCursor, { getFetchMore })
  useInfiniteQuery('key', fetchWithCursor, { getFetchMore })

  const infiniteQuery = useInfiniteQuery(['key'], fetchWithCursor, {
    getFetchMore,
  })

  // The next example does not work; the type for cursor does not get inferred.
  // useInfiniteQuery(['key'], fetchWithCursor, {
  //     getFetchMore: (last, all) => 'string',
  // });

  infiniteQuery.data // $ExpectType number[][] | undefined
  infiniteQuery.fetchMore() // $ExpectType Promise<number[][]> | undefined
  infiniteQuery.fetchMore('next') // $ExpectType Promise<number[][]> | undefined
  infiniteQuery.fetchMore('next', { previous: true }) // $ExpectType Promise<number[][]> | undefined
}

function infiniteQueryWithObjectSyntax() {
  useInfiniteQuery({
    queryKey: ['key', 1],
    queryFn: async (key, id, next = 0) => ({ next: next + 1 }),
    config: {
      getFetchMore: (last: { next: number }) => last.next, // annotation on this type is required to infer the type
    },
  }).data // $ExpectType { next: number; }[] | undefined
  useInfiniteQuery({
    queryKey: ['key', 1],
    queryFn: async (key, id, next = 0) => ({ next: next + 1 }),
    config: {
      getFetchMore: (last: { next: number }) => last.next, // annotation on this type is required to infer the type
    },
  }).data // $ExpectType { next: number; }[] | undefined
  useInfiniteQuery({
    queryKey: 'key',
    queryFn: async (
      key, // $ExpectType "key"
      next = 0
    ) => ({ next: next + 1 }),
    config: {
      getFetchMore: (last: { next: number }) => last.next, // annotation on this type is required to infer the type
    },
  }).data // $ExpectType { next: number; }[] | undefined
  useInfiniteQuery({
    queryKey: 'key',
    queryFn: async (
      key, // $ExpectType "key"
      next = 0
    ) => ({ next: next + 1 }),
    config: {
      getFetchMore: (last: { next: number }) => last.next, // annotation on this type is required to infer the type
    },
  }).data // $ExpectType { next: number; }[] | undefined

  useInfiniteQuery<{ next: number }, string, undefined>({
    queryKey: 'key',
  }).data // $ExpectType { next: number; }[] | undefined

  useInfiniteQuery<{ next: number }, [string], undefined>({
    queryKey: ['key'],
  }).data // $ExpectType { next: number; }[] | undefined
}

function log(...args: any[]) {}

// Simple mutation
function simpleMutation() {
  const mutation = () => Promise.resolve(['foo', 'bar'])

  const [mutate, mutationState] = useMutation(mutation, {
    onSuccess(result) {
      result // $ExpectType string[]
    },
    throwOnError: false,
  })
  mutate()
  mutate({ throwOnError: true })

  mutate({
    throwOnError: true,
    onSettled(result, error) {
      result // $ExpectType string[] | undefined
      error // $ExpectType Error | null
    },
    onError(
      error // $ExpectType Error
    ) {},
    onSuccess(
      result // $ExpectType string[]
    ) {},
  })

  // Invalid mutatation function
  useMutation((arg1: string, arg2: string) => Promise.resolve()) // $ExpectError
  useMutation((arg1: string) => null) // $ExpectError

  mutationState.data // $ExpectType string[] | undefined
  mutationState.error // $ExpectType Error | null | undefined
  mutationState.isError // $ExpectType boolean
  mutationState.isIdle // $ExpectType boolean
  mutationState.isLoading // $ExpectType boolean
  mutationState.isSuccess // $ExpectType boolean
  mutationState.reset // $ExpectType () => void
  mutationState.status // $ExpectType "idle" | "loading" | "error" | "success"
  mutationState.promise // $ExpectError
}

function mutationWithVariables() {
  // Mutation with variables
  const [mutateWithVars] = useMutation(
    ({ param }: { param: number }) => Promise.resolve(Boolean(param)),
    {
      useErrorBoundary: true,
      onMutate(variables) {
        variables // $ExpectType { param: number; }
        return { snapshot: variables.param }
      },
    }
  )

  mutateWithVars(
    { param: 1 },
    {
      async onSuccess(data) {
        data // $ExpectType boolean
      },
    }
  )

  mutateWithVars({ param: 'test' }) // $ExpectError
}

function helpers() {
  useIsFetching() // $ExpectType number

  setConsole({ log, error: log, warn: log })
}

function globalConfig() {
  const globalConfig: ReactQueryProviderConfig = {
    queries: {
      useErrorBoundary: true,
      refetchOnWindowFocus: true,
    },
    shared: {
      suspense: true,
    },
    mutations: {
      throwOnError: true,
      useErrorBoundary: true,
      onMutate: (variables: unknown) => Promise.resolve(),
      onSuccess: (data: unknown, variables: unknown) => undefined,
      onError: (err: Error, variables: unknown, snapshotValue: unknown) =>
        undefined,
      onSettled: (
        data: unknown,
        error: Error | null,
        variables: unknown,
        snapshotValue?: unknown
      ) => undefined,
    },
  }
}

function dataDiscriminatedUnion() {
  // Query Variables
  const param = 'test'
  const queryResult = useQuery(['todos', { param }], (key, variables) =>
    Promise.resolve([param])
  )

  queryResult.data // $ExpectType string[] | undefined

  // Discriminated union over status
  if (queryResult.status === 'loading') {
    queryResult.data // $ExpectType string[] | undefined
    queryResult.error // $ExpectType Error | null
  }

  if (queryResult.status === 'error') {
    // disabled
    queryResult.data // $ExpectType string[] | undefined
    queryResult.error // $ExpectType Error
  }

  if (queryResult.status === 'success') {
    // disabled
    queryResult.data // $ExpectType string[]
    queryResult.error // $ExpectType null
  }

  // Discriminated union over status flags
  if (queryResult.isLoading) {
    queryResult.data // $ExpectType string[] | undefined
    queryResult.error // $ExpectType Error | null
  }

  if (queryResult.isError) {
    // disabled
    queryResult.data // $ExpectType string[] | undefined
    queryResult.error // $ExpectType Error
  }

  if (queryResult.isSuccess) {
    // disabled
    queryResult.data // $ExpectType string[]
    queryResult.error // $ExpectType null
  }
}

function mutationStatusDiscriminatedUnion() {
  const mutation = () => Promise.resolve(['foo', 'bar'])
  const [mutate, mutationState] = useMutation(mutation)
  mutate()
  // enabled
  // TODO: handle invalid argument passed to mutationFn
  // mutate('arg'); // $ExpectError
  mutate('arg') // $ExpectError
  mutationState.data // $ExpectType string[] | undefined

  // Discriminated union over status
  if (mutationState.status === 'idle') {
    mutationState.data // $ExpectType undefined
    mutationState.error // $ExpectType null
  }

  if (mutationState.status === 'loading') {
    mutationState.data // $ExpectType undefined
    // corrected
    // mutationState.error; // $ExpectType null
    mutationState.error // $ExpectType undefined
  }

  if (mutationState.status === 'error') {
    mutationState.data // $ExpectType undefined
    mutationState.error // $ExpectType Error
  }

  if (mutationState.status === 'success') {
    mutationState.data // $ExpectType string[]
    mutationState.error // $ExpectType undefined
  }

  if (mutationState.isIdle) {
    mutationState.data // $ExpectType undefined
    mutationState.error // $ExpectType null
  }

  if (mutationState.isLoading) {
    mutationState.data // $ExpectType undefined
    // corrected
    // mutationState.error; // $ExpectType null
    mutationState.error // $ExpectType undefined
  }

  if (mutationState.isError) {
    mutationState.data // $ExpectType undefined
    mutationState.error // $ExpectType Error
  }

  if (mutationState.isSuccess) {
    mutationState.data // $ExpectType string[]
    mutationState.error // $ExpectType undefined
  }
}
