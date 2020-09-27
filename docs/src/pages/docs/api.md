---
id: api
title: API Reference
---

## `useQuery`

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
  queryKeySerializerFn,
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
  - If a string is passed, it will be used as the query key.
  - If an array is passed, each item will be serialized into a stable query key. See [Query Keys](./guides/query-keys) for more information.
  - The query will automatically update when this key changes (as long as `enabled` is not set to `false`).
- `queryFn: (...params: unknown[]) => Promise<TData>`
  - **Required, but only if no default query function has been defined**
  - The function that the query will use to request data.
  - Receives the following variables in the order that they are provided:
    - Query Key parameters
  - Must return a promise that will either resolves data or throws an error.
- `enabled: boolean | unknown`
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
- `initialData: unnown | () => unknown`
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

## `useQueries`

The `useQueries` hook can be used to fetch a variable number of queries:

```js
const results = useQueries([
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])
```

**Options**

The `useQueries` hook accepts an array with query option objects identical to the [`useQuery` hook](#usequery).

**Returns**

The `useQueries` hook returns an array with all the query results.

## `useInfiniteQuery`

```js

const queryFn = (...queryKey, fetchMoreVariable) // => Promise

const {
  isFetchingMore,
  fetchMore,
  canFetchMore,
  ...result
} = useInfiniteQuery(queryKey, queryFn, {
  ...options,
  getFetchMore: (lastPage, allPages) => fetchMoreVariable
})
```

**Options**

The options for `useInfiniteQuery` are identical to the [`useQuery` hook](#usequery) with the addition of the following:

- `getFetchMore: (lastPage, allPages) => fetchMoreVariable | boolean`
  - When new data is received for this query, this function receives both the last page of the infinite list of data and the full array of all pages.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function

**Returns**

The returned properties for `useInfiniteQuery` are identical to the [`useQuery` hook](#usequery), with the addition of the following:

- `isFetchingMore: false | 'next' | 'previous'`
  - If using `paginated` mode, this will be `true` when fetching more results using the `fetchMore` function.
- `fetchMore: (fetchMoreVariableOverride) => Promise<UseInfiniteQueryResult>`
  - This function allows you to fetch the next "page" of results.
  - `fetchMoreVariableOverride` allows you to optionally override the fetch more variable returned from your `getFetchMore` option to your query function to retrieve the next page of results.
- `canFetchMore: boolean`
  - If using `paginated` mode, this will be `true` if there is more data to be fetched (known via the required `getFetchMore` option function).

## `useMutation`

```js
const [
  mutate,
  { status, isIdle, isLoading, isSuccess, isError, data, error, reset },
] = useMutation(mutationFn, {
  onMutate,
  onSuccess,
  onError,
  onSettled,
  throwOnError,
  useErrorBoundary,
})

const promise = mutate(variables, {
  onSuccess,
  onSettled,
  onError,
  throwOnError,
})
```

**Options**

- `mutationFn: (variables: TVariables) => Promise<TData>`
  - **Required**
  - A function that performs an asynchronous task and returns a promise.
  - `variables` is an object that `mutate` will pass to your `mutationFn`
- `onMutate: (variables: TVariables) => Promise<TContext | void> | TContext | void`
  - Optional
  - This function will fire before the mutation function is fired and is passed the same variables the mutation function would receive
  - Useful to perform optimistic updates to a resource in hopes that the mutation succeeds
  - The value returned from this function will be passed to both the `onError` and `onSettled` functions in the event of a mutation failure and can be useful for rolling back optimistic updates.
- `onSuccess: (data: TData, variables: TVariables, context: TContext) => Promise<void> | void`
  - Optional
  - This function will fire when the mutation is successful and will be passed the mutation's result.
  - Fires after the `mutate`-level `onSuccess` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onError: (err: TError, variables: TVariables, context?: TContext) => Promise<void> | void`
  - Optional
  - This function will fire if the mutation encounters an error and will be passed the error.
  - Fires after the `mutate`-level `onError` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onSettled: (data: TData, error: TError, variables: TVariables, context?: TContext) => Promise<void> | void`
  - Optional
  - This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error
  - Fires after the `mutate`-level `onSettled` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `throwOnError`
  - Defaults to `false`
  - Set this to `true` if failed mutations should re-throw errors from the mutation function to the `mutate` function.
- `useErrorBoundary`
  - Defaults to the global query config's `useErrorBoundary` value, which is `false`
  - Set this to true if you want mutation errors to be thrown in the render phase and propagate to the nearest error boundary

**Returns**

- `mutate: (variables: TVariables, { onSuccess, onSettled, onError, throwOnError }) => Promise<TData>`
  - The mutation function you can call with variables to trigger the mutation and optionally override the original mutation options.
  - `variables: TVariables`
    - Optional
    - The variables object to pass to the `mutationFn`.
  - Remaining options extend the same options described above in the `useMutation` hook.
  - Lifecycle callbacks defined here will fire **after** those of the same type defined in the `useMutation`-level options.
- `status: string`
  - Will be:
    - `idle` initial status prior to the mutation function executing.
    - `loading` if the mutation is currently executing.
    - `error` if the last mutation attempt resulted in an error.
    - `success` if the last mutation attempt was successful.
- `isIdle`, `isLoading`, `isSuccess`, `isError`: boolean variables derived from `status`
- `data: undefined | unknown`
  - Defaults to `undefined`
  - The last successfully resolved data for the query.
- `error: null | TError`
  - The error object for the query, if an error was encountered.
- `reset: () => void`
  - A function to clean the mutation internal state (i.e., it resets the mutation to its initial state).

## `QueryClient`

The `QueryClient` can be used to interact with a cache:

```js
import { QueryClient, QueryCache } from 'react-query'

const cache = new QueryCache()
const client = new QueryClient({
  cache,
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

await client.prefetchQuery('posts', fetchPosts)
```

Its available methods are:

- [`fetchQueryData`](#clientfetchquerydata)
- [`prefetchQuery`](#clientprefetchquery)
- [`getQueryData`](#clientgetquerydata)
- [`setQueryData`](#clientsetquerydata)
- [`refetchQueries`](#clientrefetchqueries)
- [`invalidateQueries`](#clientinvalidatequeries)
- [`cancelQueries`](#clientcancelqueries)
- [`removeQueries`](#clientremovequeries)
- [`watchQuery`](#clientwatchquery)
- [`watchQueries`](#clientwatchqueries)
- [`isFetching`](#queryclientisfetching)
- [`setQueryDefaults`](#clientsetquerydefaults)

**Options**

- `cache: QueryCache`
  - The query cache this client is connected to.
- `defaultOptions: DefaultOptions`
  - Optional
  - Define defaults for all queries and mutations using this query client.

## `client.fetchQueryData`

`fetchQueryData` is an asynchronous method that can be used to fetch and cache a query. It will either resolve with the data or throw with the error. Use the `prefetchQuery` method if you just want to fetch a query without needing the result.

If the query exists and the data is not invalidated or older than the given `staleTime`, then the data from the cache will be returned. Otherwise it will try to fetch the latest data.

> The difference between using `fetchQueryData` and `setQueryData` is that `fetchQueryData` is async and will ensure that duplicate requests for this query are not created with `useQuery` instances for the same query are rendered while the data is fetching.

```js
try {
  const data = await client.fetchQueryData(queryKey, queryFn)
} catch (error) {
  console.log(error)
}
```

Specify a `staleTime` to only fetch when the data is older than a certain amount of time:

```js
try {
  const data = await client.fetchQueryData(queryKey, queryFn, {
    staleTime: 10000,
  })
} catch (error) {
  console.log(error)
}
```

**Options**

The options for `fetchQueryData` are exactly the same as those of [`useQuery`](#usequery).

**Returns**

- `Promise<TData>`

## `client.prefetchQuery`

`prefetchQuery` is an asynchronous method that can be used to prefetch a query before it is needed or rendered with `useQuery` and friends. The method works the same as `fetchQueryData` except that is will not throw or return any data.

```js
await client.prefetchQuery(queryKey, queryFn)
```

You can even use it with a default queryFn in your config!

```js
await client.prefetchQuery(queryKey)
```

**Options**

The options for `prefetchQuery` are exactly the same as those of [`useQuery`](#usequery).

**Returns**

- `Promise<void>`
  - A promise is returned that will either immediately resolve if no fetch is needed or after the query has been executed. It will not return any data or throw any errors.

## `client.getQueryData`

`getQueryData` is a synchronous function that can be used to get an existing query's cached data. If the query does not exist, `undefined` will be returned.

```js
const data = client.getQueryData(queryKey)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)

**Returns**

- `data: TData | undefined`
  - The data for the cached query, or `undefined` if the query does not exist.

## `client.setQueryData`

`setQueryData` is a synchronous function that can be used to immediately update a query's cached data. If the query does not exist, it will be created. **If the query is not utilized by a query hook in the default `cacheTime` of 5 minutes, the query will be garbage collected**.

> The difference between using `setQueryData` and `fetchQueryData` is that `setQueryData` is sync and assumes that you already synchronously have the data available. If you need to fetch the data asynchronously, it's suggested that you either refetch the query key or use `fetchQueryData` to handle the asynchronous fetch.

```js
client.setQueryData(queryKey, updater)
```

**Options**

- `queryKey: QueryKey` [Query Keys](./guides/query-keys)
- `updater: unknown | (oldData: TData | undefined) => TData`
  - If non-function is passed, the data will be updated to this value
  - If a function is passed, it will receive the old data value and be expected to return a new one.

**Using an updater value**

```js
setQueryData(queryKey, newData)
```

**Using an updater function**

For convenience in syntax, you can also pass an updater function which receives the current data value and returns the new one:

```js
setQueryData(queryKey, oldData => newData)
```

## `client.getQueryState`

`getQueryState` is a synchronous function that can be used to get an existing query's state. If the query does not exist, `undefined` will be returned.

```js
const state = client.getQueryState(queryKey)
console.log(state.updatedAt)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)

## `client.setQueryDefaults`

`setQueryDefaults` is a synchronous method to set default options for a specific query. If the query does not exist yet it will create it.

```js
client.setQueryDefaults('posts', fetchPosts)

function Component() {
  const { data } = useQuery('posts')
}
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)

## `client.invalidateQueries`

The `invalidateQueries` method can be used to invalidate and refetch single or multiple queries in the cache based on their query keys or any other functionally accessible property/state of the query. By default, all matching queries are immediately marked as invalid and active queries are refetched in the background.

- If you **do not want active queries to refetch**, and simply be marked as invalid, you can use the `refetchActive: false` option.
- If you **want inactive queries to refetch** as well, use the `refetchInactive: true` option

```js
await client.invalidateQueries('posts', {
  exact,
  refetchActive = true,
  refetchInactive = false
}, { throwOnError })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)
  - `refetchActive: Boolean`
    - Defaults to `true`
    - When set to `false`, queries that match the refetch predicate and are actively being rendered via `useQuery` and friends will NOT be refetched in the background, and only marked as invalid.
  - `refetchInactive: Boolean`
    - Defaults to `false`
    - When set to `true`, queries that match the refetch predicate and are not being rendered via `useQuery` and friends will be both marked as invalid and also refetched in the background
- `refetchOptions?: RefetchOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.

## `client.refetchQueries`

The `refetchQueries` method can be used to refetch queries based on certain conditions.

Examples:

```js
// refetch all queries:
await client.refetchQueries()

// refetch all stale queries:
await client.refetchQueries({ stale: true })

// refetch all active queries partially matching a query key:
await client.refetchQueries(['posts'], { active: true })

// refetch all active queries exactly matching a query key:
await client.refetchQueries(['posts', 1], { active: true, exact: true })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)
- `refetchOptions?: RefetchOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.

**Returns**

This function returns a promise that will resolve when all of the queries are done being refetched. By default, it **will not** throw an error if any of those queries refetches fail, but this can be configured by setting the `throwOnError` option to `true`

## `client.cancelQueries`

The `cancelQueries` method can be used to cancel outgoing queries based on their query keys or any other functionally accessible property/state of the query.

This is most useful when performing optimistic updates since you will likely need to cancel any outgoing query refetches so they don't clobber your optimistic update when they resolve.

```js
await client.cancelQueries('posts', { exact: true })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)

**Returns**

This method does not return anything

## `client.removeQueries`

The `removeQueries` method can be used to remove queries from the cache based on their query keys or any other functionally accessible property/state of the query.

```js
client.removeQueries(queryKey, { exact: true })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)

**Returns**

This method does not return anything

## `client.watchQuery`

The `watchQuery` method returns a `QueryObserver` instance which can be used to watch a query.

```js
const observer = client.watchQuery('posts')

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for `watchQuery` are exactly the same as those of [`useQuery`](#usequery).

**Returns**

- `QueryObserver`

## `client.watchQueries`

The `watchQueries` method returns a `QueriesObserver` instance to watch multiple queries.

```js
const observer = client.watchQueries([
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

**Options**

The options for `watchQueries` are exactly the same as those of [`useQueries`](#usequeries).

**Returns**

- `QueriesObserver`

## `client.isFetching`

This `isFetching` method returns an `integer` representing how many queries, if any, in the cache are currently fetching (including background-fetching, loading new pages, or loading more infinite query results)

```js
if (client.isFetching()) {
  console.log('At least one query is fetching!')
}
```

React Query also exports a handy [`useIsFetching`](#useisfetching) hook that will let you subscribe to this state in your components without creating a manual subscription to the query cache.

## `QueryCache`

The `QueryCache` is the backbone of React Query that manages all of the state, caching, lifecycle and magic of every query. It supports relatively unrestricted, but safe, access to manipulate query's as you need.

```js
import { QueryCache } from 'react-query'

const cache = new QueryCache()
const query = cache.find('posts')
```

Its available methods are:

- [`find`](#cachefind)
- [`findAll`](#cachefindall)
- [`subscribe`](#cachesubscribe)
- [`clear`](#cacheclear)

## `cache.find`

`find` is a slightly more advanced synchronous method that can be used to get an existing query instance from the cache. This instance not only contains **all** the state for the query, but all of the instances, and underlying guts of the query as well. If the query does not exist, `undefined` will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios (eg. Looking at the query.state.updatedAt timestamp to decide whether a query is fresh enough to be used as an initial value)

```js
const query = cache.find(queryKey)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)

**Returns**

- `Query`
  - The query instance from the cache

## `cache.findAll`

`findAll` is even more advanced synchronous method that can be used to get existing query instances from the cache that partially match query key. If queries do not exist, empty array will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios

```js
const queries = cache.findAll(queryKey)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](#./guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](./guides/query-filters)

**Returns**

- `Query[]`
  - Query instances from the cache

## `client.subscribe`

The `subscribe` method can be used to subscribe to the query cache as a whole and be informed of safe/known updates to the cache like query states changing or queries being updated, added or removed

```js
const callback = (cache, query) => {}

const unsubscribe = cache.subscribe(callback)
```

**Options**

- `callback: (cache, query?) => void`
  - This function will be called with the query cache any time it is updated via its tracked update mechanisms (eg, `query.setState`, `client.removeQueries`, etc). Out of scope mutations to the cache are not encouraged and will not fire subscription callbacks
  - Additionally, for updates to the cache triggered by a specific query, the `query` will be passed as the second argument to the callback

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the query cache.

## `cache.clear`

The `clear` method can be used to clear the cache entirely and start fresh.

```js
cache.clear()
```

## `useQueryClient`

The `useQueryClient` hook returns the current `QueryClient` instance.

```js
import { useQueryClient } from 'react-query'

const client = useQueryClient()
```

## `useIsFetching`

`useIsFetching` is an optional hook that returns the `number` of the queries that your application is loading or fetching in the background (useful for app-wide loading indicators).

```js
import { useIsFetching } from 'react-query'

const isFetching = useIsFetching()
```

**Returns**

- `isFetching: number`
  - Will be the `number` of the queries that your application is currently loading or fetching in the background.

## `QueryClientProvider`

Use the `QueryClientProvider` component to connect a `QueryClient` to your application:

```js
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'

const cache = new QueryCache()
const client = new QueryClient({ cache })

function App() {
  return <QueryClientProvider client={client}>...</QueryClientProvider>
}
```

## `QueryErrorResetBoundary`

When using **suspense** or **useErrorBoundaries** in your queries, you need a way to let queries know that you want to try again when re-rendering after some error occured. With the `QueryErrorResetBoundary` component you can reset any query errors within the boundaries of the component.

```js
import { QueryErrorResetBoundary } from 'react-query'
import { ErrorBoundary } from 'react-error-boundary'

const App: React.FC = () => (
  <QueryErrorResetBoundary>
    {({ reset }) => (
      <ErrorBoundary
        onReset={reset}
        fallbackRender={({ resetErrorBoundary }) => (
          <div>
            There was an error!
            <Button onClick={() => resetErrorBoundary()}>Try again</Button>
          </div>
        )}
      >
        <Page />
      </ErrorBoundary>
    )}
  </QueryErrorResetBoundary>
)
```

## `useQueryErrorResetBoundary`

This hook will reset any query errors within the closest `QueryErrorResetBoundary`. If there is no boundary defined it will reset them globally:

```js
import { useQueryErrorResetBoundary } from 'react-query'
import { ErrorBoundary } from 'react-error-boundary'

const App: React.FC = () => {
  const { reset } = useQueryErrorResetBoundary()
  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ resetErrorBoundary }) => (
        <div>
          There was an error!
          <Button onClick={() => resetErrorBoundary()}>Try again</Button>
        </div>
      )}
    >
      <Page />
    </ErrorBoundary>
  )
}
```

## `setConsole`

`setConsole` is an optional utility function that allows you to replace the `console` interface used to log errors. By default, the `window.console` object is used. If no global `console` object is found in the environment, nothing will be logged.

```js
import { setConsole } from 'react-query'
import { printLog, printWarn, printError } from 'custom-logger'

setConsole({
  log: printLog,
  warn: printWarn,
  error: printError,
})
```

**Options**

- `console: Object`
  - Must implement the `log`, `warn`, and `error` methods.

## `hydration/dehydrate`

`dehydrate` creates a frozen representation of a `cache` that can later be hydrated with `useHydrate`, `hydrate` or `Hydrate`. This is useful for passing prefetched queries from server to client or persisting queries to localstorage. It only includes currently successful queries by default.

```js
import { dehydrate } from 'react-query/hydration'

const dehydratedState = dehydrate(cache, {
  shouldDehydrate,
})
```

**Options**

- `cache: QueryCache`
  - **Required**
  - The `cache` that should be dehydrated
- `shouldDehydrate: (query: Query) => boolean`
  - This function is called for each query in the cache
  - Return `true` to include this query in dehydration, or `false` otherwise
  - Default version only includes successful queries, do `shouldDehydrate: () => true` to include all queries

**Returns**

- `dehydratedState: DehydratedState`
  - This includes everything that is needed to hydrate the `cache` at a later point
  - You **should not** rely on the exact format of this response, it is not part of the public API and can change at any time
  - This result is not in serialized form, you need to do that yourself if desired

## `hydration/hydrate`

`hydrate` adds a previously dehydrated state into a `cache`. If the queries included in dehydration already exist in the cache, `hydrate` does not overwrite them.

```js
import { hydrate } from 'react-query/hydration'

hydrate(cache, dehydratedState)
```

**Options**

- `cache: QueryCache`
  - **Required**
  - The `cache` to hydrate the state into
- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate into the cache

## `hydration/useHydrate`

`useHydrate` adds a previously dehydrated state into the `cache` returned by `useQueryCache`.

```jsx
import { useHydrate } from 'react-query/hydration'

useHydrate(dehydratedState)
```

**Options**

- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate

## `hydration/Hydrate`

`hydration/Hydrate` does the same thing as `useHydrate` but exposed as a component.

```js
import { Hydrate } from 'react-query/hydration'

function App() {
  return <Hydrate state={dehydratedState}>...</Hydrate>
}
```

**Options**

- `state: DehydratedState`
  - The state to hydrate
