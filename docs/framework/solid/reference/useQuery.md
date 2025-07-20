---
id: useQuery
title: useQuery
---

```tsx
const {
  data,
  dataUpdatedAt,
  error,
  errorUpdatedAt,
  failureCount,
  failureReason,
  fetchStatus,
  isError,
  isFetched,
  isFetchedAfterMount,
  isFetching,
  isInitialLoading,
  isLoading,
  isLoadingError,
  isPaused,
  isPending,
  isPlaceholderData,
  isRefetchError,
  isRefetching,
  isStale,
  isSuccess,
  refetch,
  status,
} = useQuery(
  () => ({
    queryKey,
    queryFn,
    enabled,
    select,
    placeholderData,
    deferStream,
    reconcile,
    gcTime,
    networkMode,
    initialData,
    initialDataUpdatedAt,
    meta,
    queryKeyHashFn,
    refetchInterval,
    refetchIntervalInBackground,
    refetchOnMount,
    refetchOnReconnect,
    refetchOnWindowFocus,
    retry,
    retryOnMount,
    retryDelay,
    staleTime,
    throwOnError,
  }),
  () => queryClient,
)
```

## Usage example

Here are some examples of how to use the `useQuery` primitive in Solid Query.

### Basic

The most basic usage of `useQuery` is to create a query that fetches data from an API.

```tsx
import { useQuery } from '@tanstack/solid-query'

function App() {
  const todos = useQuery(() => ({
    queryKey: 'todos',
    queryFn: async () => {
      const response = await fetch('/api/todos')
      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }
      return response.json()
    },
  }))

  return (
    <div>
      <Show when={todos.isError}>
        <div>Error: {todos.error.message}</div>
      </Show>
      <Show when={todos.isLoading}>
        <div>Loading...</div>
      </Show>
      <Show when={todos.isSuccess}>
        <div>
          <div>Todos:</div>
          <ul>
            <For each={todos.data}>{(todo) => <li>{todo.title}</li>}</For>
          </ul>
        </div>
      </Show>
    </div>
  )
}
```

### Reactive Options

The reason why `useQuery` accepts a function that returns an object is to allow for reactive options. This is useful when query options depend on other values/signals that might change over time. Solid Query can track the passed function in a reactive scope and re-run it whenever the dependencies change.

```tsx
import { useQuery } from '@tanstack/solid-query'

function App() {
  const [filter, setFilter] = createSignal('all')

  const todos = useQuery(() => ({
    queryKey: ['todos', filter()],
    queryFn: async () => {
      const response = await fetch(`/api/todos?filter=${filter()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }
      return response.json()
    },
  }))

  return (
    <div>
      <div>
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      <Show when={todos.isError}>
        <div>Error: {todos.error.message}</div>
      </Show>
      <Show when={todos.isLoading}>
        <div>Loading...</div>
      </Show>
      <Show when={todos.isSuccess}>
        <div>
          <div>Todos:</div>
          <ul>
            <For each={todos.data}>{(todo) => <li>{todo.title}</li>}</For>
          </ul>
        </div>
      </Show>
    </div>
  )
}
```

### Usage with `Suspense`

`useQuery` supports triggering SolidJS `Suspense` and `ErrorBoundary` components when the query is in a pending or error state. This allows you to easily handle loading and error states in your components.

```tsx
import { useQuery } from '@tanstack/solid-query'

function App() {
  const todos = useQuery(() => ({
    queryKey: 'todos',
    queryFn: async () => {
      const response = await fetch('/api/todos')
      if (!response.ok) {
        throw new Error('Failed to fetch todos')
      }
      return response.json()
    },
    throwOnError: true,
  }))

  return (
    <ErrorBoundary fallback={<div>Error: {todos.error.message}</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <div>
          <div>Todos:</div>
          <ul>
            <For each={todos.data}>{(todo) => <li>{todo.title}</li>}</For>
          </ul>
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}
```

## `useQuery` Parameters

- ### Query Options - `Accessor<QueryOptions>`
  - ##### `queryKey: unknown[]`
    - **Required**
    - The query key to use for this query.
    - The query key will be hashed into a stable hash. See [Query Keys](../../guides/query-keys.md) for more information.
    - The query will automatically update when this key changes (as long as `enabled` is not set to `false`).
  - ##### `queryFn: (context: QueryFunctionContext) => Promise<TData>`
    - **Required, but only if no default query function has been defined** See [Default Query Function](../../guides/default-query-function.md) for more information.
    - The function that the query will use to request data.
    - Receives a [QueryFunctionContext](../../guides/query-functions.md#queryfunctioncontext)
    - Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`.
  - ##### `enabled: boolean`
    - Set this to `false` to disable this query from automatically running.
    - Can be used for [Dependent Queries](../../guides/dependent-queries.md) for more information.
  - ##### `select: (data: TData) => unknown`
    - Optional
    - This option can be used to transform or select a part of the data returned by the query function. It affects the returned `data` value, but does not affect what gets stored in the query cache.
    - The `select` function will only run if `data` changed, or if the reference to the `select` function itself changes. To optimize, wrap the function in `useCallback`.
  - ##### `placeholderData: TData | (previousValue: TData | undefined; previousQuery: Query | undefined,) => TData`
    - Optional
    - If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `pending` state.
    - `placeholderData` is **not persisted** to the cache
    - If you provide a function for `placeholderData`, as a first argument you will receive previously watched query data if available, and the second argument will be the complete previousQuery instance.
  - ##### `deferStream: boolean`
    - Optional
    - Defaults to `false`
    - Only applicable while rendering queries on the server with streaming.
    - Set `deferStream` to `true` to wait for the query to resolve on the server before flushing the stream.
    - This can be useful to avoid sending a loading state to the client before the query has resolved.
  - ##### `reconcile: false | string | ((oldData: TData | undefined, newData: TData) => TData)`
    - Optional
    - Defaults to `false`
    - Set this to a string to enable reconciliation between query results based on the string key.
    - Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom reconciliation logic.
  - ##### `gcTime: number | Infinity`
    - Defaults to `5 * 60 * 1000` (5 minutes) or `Infinity` during SSR
    - The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different garbage collection times are specified, the longest one will be used.
    - Note: the maximum allowed time is about 24 days. See [more](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value).
    - If set to `Infinity`, will disable garbage collection
  - ##### `networkMode: 'online' | 'always' | 'offlineFirst`
    - optional
    - defaults to `'online'`
    - see [Network Mode](../../guides/network-mode.md) for more information.
  - ##### `initialData: TData | () => TData`
    - Optional
    - If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet)
    - If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initialData
    - Initial data is considered stale by default unless a `staleTime` has been set.
    - `initialData` **is persisted** to the cache
  - ##### `initialDataUpdatedAt: number | (() => number | undefined)`
    - Optional
    - If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated.
  - ##### `meta: Record<string, unknown>`
    - Optional
    - If set, stores additional information on the query cache entry that can be used as needed. It will be accessible wherever the `query` is available, and is also part of the `QueryFunctionContext` provided to the `queryFn`.
  - ##### `queryKeyHashFn: (queryKey: QueryKey) => string`
    - Optional
    - If specified, this function is used to hash the `queryKey` to a string.
  - ##### `refetchInterval: number | false | ((query: Query) => number | false | undefined)`
    - Optional
    - If set to a number, all queries will continuously refetch at this frequency in milliseconds
    - If set to a function, the function will be executed with the query to compute a frequency
  - ##### `refetchIntervalInBackground: boolean`
    - Optional
    - If set to `true`, queries that are set to continuously refetch with a `refetchInterval` will continue to refetch while their tab/window is in the background
  - ##### `refetchOnMount: boolean | "always" | ((query: Query) => boolean | "always")`
    - Optional
    - Defaults to `true`
    - If set to `true`, the query will refetch on mount if the data is stale.
    - If set to `false`, the query will not refetch on mount.
    - If set to `"always"`, the query will always refetch on mount.
    - If set to a function, the function will be executed with the query to compute the value
  - ##### `refetchOnWindowFocus: boolean | "always" | ((query: Query) => boolean | "always")`
    - Optional
    - Defaults to `true`
    - If set to `true`, the query will refetch on window focus if the data is stale.
    - If set to `false`, the query will not refetch on window focus.
    - If set to `"always"`, the query will always refetch on window focus.
    - If set to a function, the function will be executed with the query to compute the value
  - ##### `refetchOnReconnect: boolean | "always" | ((query: Query) => boolean | "always")`
    - Optional
    - Defaults to `true`
    - If set to `true`, the query will refetch on reconnect if the data is stale.
    - If set to `false`, the query will not refetch on reconnect.
    - If set to `"always"`, the query will always refetch on reconnect.
    - If set to a function, the function will be executed with the query to compute the value
  - ##### `retry: boolean | number | (failureCount: number, error: TError) => boolean`
    - If `false`, failed queries will not retry by default.
    - If `true`, failed queries will retry infinitely.
    - If set to a `number`, e.g. `3`, failed queries will retry until the failed query count meets that number.
    - defaults to `3` on the client and `0` on the server
  - ##### `retryOnMount: boolean`
    - If set to `false`, the query will not be retried on mount if it contains an error. Defaults to `true`.
  - ##### `retryDelay: number | (retryAttempt: number, error: TError) => number`
    - This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds.
    - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff.
    - A function like `attempt => attempt * 1000` applies linear backoff.
  - ##### `staleTime: number | Infinity`
    - Optional
    - Defaults to `0`
    - The time in milliseconds after data is considered stale. This value only applies to the hook it is defined on.
    - If set to `Infinity`, the data will never be considered stale
  - ##### `throwOnError: undefined | boolean | (error: TError, query: Query) => boolean`
    - Set this to `true` if you want errors to be thrown in the render phase and propagate to the nearest error boundary
    - Set this to `false` to disable `suspense`'s default behavior of throwing errors to the error boundary.
    - If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`)

- ### Query Client - `Accessor<QueryClient>`
  - Optional
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.

## `useQuery` Return Value - `Store<QueryResult<TData, TError>>`

`useQuery` returns a SolidJS store with the following properties:

- ##### `status: QueryStatus`
  - Will be:
    - `pending` if there's no cached data and no query attempt was finished yet.
    - `error` if the query attempt resulted in an error. The corresponding `error` property has the error received from the attempted fetch
    - `success` if the query has received a response with no errors and is ready to display its data. The corresponding `data` property on the query is the data received from the successful fetch or if the query's `enabled` property is set to `false` and has not been fetched yet `data` is the first `initialData` supplied to the query on initialization.
- ##### `isPending: boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- ##### `isSuccess: boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- ##### `isError: boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- ##### `isLoadingError: boolean`
  - Will be `true` if the query failed while fetching for the first time.
- ##### `isRefetchError: boolean`
  - Will be `true` if the query failed while refetching.
- ##### `data: Resource<TData>`
  - Defaults to `undefined`.
  - The last successfully resolved data for the query.
  - **Important**: The `data` property is a SolidJS resource. This means that if the data is accessed underneath a `<Suspense>` component,
    it will trigger the Suspense boundary if the data is not available yet.
- ##### `dataUpdatedAt: number`
  - The timestamp for when the query most recently returned the `status` as `"success"`.
- ##### `error: null | TError`
  - Defaults to `null`
  - The error object for the query, if an error was thrown.
- ##### `errorUpdatedAt: number`
  - The timestamp for when the query most recently returned the `status` as `"error"`.
- ##### `isStale: boolean`
  - Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`.
- ##### `isPlaceholderData: boolean`
  - Will be `true` if the data shown is the placeholder data.
- ##### `isFetched: boolean`
  - Will be `true` if the query has been fetched.
- ##### `isFetchedAfterMount: boolean`
  - Will be `true` if the query has been fetched after the component mounted.
  - This property can be used to not show any previously cached data.
- ##### `fetchStatus: FetchStatus`
  - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetches.
  - `paused`: The query wanted to fetch, but has been `paused`.
  - `idle`: The query is not fetching.
  - see [Network Mode](../../guides/network-mode.md) for more information.
- ##### `isFetching: boolean`
  - A derived boolean from the `fetchStatus` variable above, provided for convenience.
- ##### `isPaused: boolean`
  - A derived boolean from the `fetchStatus` variable above, provided for convenience.
- ##### `isRefetching: boolean`
  - Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`
  - Is the same as `isFetching && !isPending`
- ##### `isLoading: boolean`
  - Is `true` whenever the first fetch for a query is in-flight
  - Is the same as `isFetching && isPending`
- ##### `isInitialLoading: boolean`
  - **deprecated**
  - An alias for `isLoading`, will be removed in the next major version.
- ##### `failureCount: number`
  - The failure count for the query.
  - Incremented every time the query fails.
  - Reset to `0` when the query succeeds.
- ##### `failureReason: null | TError`
  - The failure reason for the query retry.
  - Reset to `null` when the query succeeds.
- ##### `errorUpdateCount: number`
  - The sum of all errors.
- ##### `refetch: (options: { throwOnError: boolean, cancelRefetch: boolean }) => Promise<UseQueryResult>`
  - A function to manually refetch the query.
  - If the query errors, the error will only be logged. If you want an error to be thrown, pass the `throwOnError: true` option
  - `cancelRefetch?: boolean`
    - Defaults to `true`
      - Per default, a currently running request will be cancelled before a new request is made
    - When set to `false`, no refetch will be made if there is already a request running.
