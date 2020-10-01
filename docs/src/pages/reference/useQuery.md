---
id: useQuery
title: useQuery
---

```js
const {
  data,
  error,
  failureCount,
  isError,
  isFetchedAfterMount,
  isFetching,
  isIdle,
  isLoading,
  isPreviousData,
  isStale,
  isSuccess,
  refetch,
  remove,
  status,
} = useQuery(queryKey, queryFn?, {
  cacheTime,
  enabled,
  initialData,
  isDataEqual,
  keepPreviousData,
  notifyOnStatusChange,
  onError,
  onSettled,
  onSuccess,
  queryFnParamsFilter,
  queryKeyHashFn,
  refetchInterval,
  refetchIntervalInBackground,
  refetchOnMount,
  refetchOnReconnect,
  refetchOnWindowFocus,
  retry,
  retryDelay,
  staleTime,
  structuralSharing,
  suspense,
  useErrorBoundary,
})

// or using the object syntax

const result = useQuery({
  queryKey,
  queryFn,
  enabled,
})
```

**Options**

- `queryKey: string | unknown[]`
  - **Required**
  - The query key to use for this query.
  - The query key will be hashed into a stable hash. See [Query Keys](./guides/query-keys) for more information.
  - The query will automatically update when this key changes (as long as `enabled` is not set to `false`).
- `queryFn: (...params: unknown[]) => Promise<TData>`
  - **Required, but only if no default query function has been defined**
  - The function that the query will use to request data.
  - Receives the following variables in the order that they are provided:
    - Query Key parameters
  - Must return a promise that will either resolves data or throws an error.
- `enabled: boolean`
  - Set this to `false` to disable this query from automatically running.
  - Actually it can be anything that will pass a boolean condition. See [Dependent Queries](./guides/queries#dependent-queries) for more information.
- `retry: boolean | number | (failureCount: number, error: TError) => boolean`
  - If `false`, failed queries will not retry by default.
  - If `true`, failed queries will retry infinitely.
  - If set to an `number`, e.g. `3`, failed queries will retry until the failed query count meets that number.
- `retryDelay: (retryAttempt: number) => number`
  - This function receives a `retryAttempt` integer and returns the delay to apply before the next attempt in milliseconds.
  - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff.
  - A function like `attempt => attempt * 1000` applies linear backoff.
- `staleTime: number | Infinity`
  - The time in milliseconds after data is considered stale. This value only applies to the hook it is defined on.
  - If set to `Infinity`, the data will never be considered stale
- `cacheTime: number | Infinity`
  - The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different cache times are specified, the longest one will be used.
  - If set to `Infinity`, will disable garbage collection
- `refetchInterval: false | number`
  - Optional
  - If set to a number, all queries will continuously refetch at this frequency in milliseconds
- `refetchIntervalInBackground: boolean`
  - Optional
  - If set to `true`, queries that are set to continuously refetch with a `refetchInterval` will continue to refetch while their tab/window is in the background
- `refetchOnMount: boolean | "always"`
  - Optional
  - Defaults to `true`
  - If set to `true`, the query will refetch on mount if the data is stale.
  - If set to `false`, the query will not refetch on mount.
  - If set to `"always"`, the query will always refetch on mount.
- `refetchOnWindowFocus: boolean | "always"`
  - Optional
  - Defaults to `true`
  - If set to `true`, the query will refetch on window focus if the data is stale.
  - If set to `false`, the query will not refetch on window focus.
  - If set to `"always"`, the query will always refetch on window focus.
- `refetchOnReconnect: boolean | "always"`
  - Optional
  - Defaults to `true`
  - If set to `true`, the query will refetch on reconnect if the data is stale.
  - If set to `false`, the query will not refetch on reconnect.
  - If set to `"always"`, the query will always refetch on reconnect.
- `notifyOnStatusChange: boolean`
  - Optional
  - Set this to `false` to only re-render when there are changes to `data` or `error`.
  - Defaults to `true`.
- `onSuccess: (data: TData) => void`
  - Optional
  - This function will fire any time the query successfully fetches new data.
- `onError: (error: TError) => void`
  - Optional
  - This function will fire if the query encounters an error and will be passed the error.
- `onSettled: (data?: TData, error?: TError) => void`
  - Optional
  - This function will fire any time the query is either successfully fetched or errors and be passed either the data or error
- `select: (data: TData) => unknown`
  - Optional
  - This option can be used to transform or select a part of the data returned by the query function.
- `suspense: boolean`
  - Optional
  - Set this to `true` to enable suspense mode.
  - When `true`, `useQuery` will suspend when `status === 'loading'`
  - When `true`, `useQuery` will throw runtime errors when `status === 'error'`
- `initialData: unknown | () => unknown`
  - Optional
  - If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet)
  - If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initialData
  - Initial data is considered stale by default unless a `staleTime` has been set.
- `keepPreviousData: boolean`
  - Optional
  - Defaults to `false`
  - If set, any previous `data` will be kept when fetching new data because the query key changed.
- `queryFnParamsFilter: (...params: unknown[]) => unknown[]`
  - Optional
  - This function will filter the params that get passed to `queryFn`.
  - For example, you can filter out the first query key from the params by using `queryFnParamsFilter: params => params.slice(1)`.
- `structuralSharing: boolean`
  - Optional
  - Defaults to `true`
  - If set to `false`, structural sharing between query results will be disabled.

**Returns**

- `status: String`
  - Will be:
    - `idle` if the query is idle. This only happens if a query is initialized with `enabled: false` and no initial data is available.
    - `loading` if the query is in a "hard" loading state. This means there is no cached data and the query is currently fetching, eg `isFetching === true`
    - `error` if the query attempt resulted in an error. The corresponding `error` property has the error received from the attempted fetch
    - `success` if the query has received a response with no errors and is ready to display its data. The corresponding `data` property on the query is the data received from the successful fetch or if the query is in `manual` mode and has not been fetched yet `data` is the first `initialData` supplied to the query on initialization.
- `isIdle: boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- `isLoading: boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- `isSuccess: boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- `isError: boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- `data: TData`
  - Defaults to `undefined`.
  - The last successfully resolved data for the query.
- `error: null | TError`
  - Defaults to `null`
  - The error object for the query, if an error was thrown.
- `isStale: boolean`
  - Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`.
- `isPreviousData: boolean`
  - Will be `true` when `keepPreviousData` is set and data from the previous query is returned.
- `isFetchedAfterMount: boolean`
  - Will be `true` if the query has been fetched after the component mounted.
  - This property can be used to not show any previously cached data.
- `isFetching: boolean`
  - Defaults to `true` so long as `manual` is set to `false`
  - Will be `true` if the query is currently fetching, including background fetching.
- `failureCount: number`
  - The failure count for the query.
  - Incremented every time the query fails.
  - Reset to `0` when the query succeeds.
- `refetch: (options: { throwOnError: boolean }) => Promise<UseQueryResult>`
  - A function to manually refetch the query.
  - If the query errors, the error will only be logged. If you want an error to be thrown, pass the `throwOnError: true` option
- `remove: () => void`
  - A function to remove the query from the cache.
