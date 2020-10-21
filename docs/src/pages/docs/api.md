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
  initialStale,
  placeholderData,
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

const queryInfo = useQuery({
  queryKey,
  queryFn,
  config,
})
```

**Options**

- `queryKey: String | any[]`
  - **Required**
  - The query key to use for this query.
  - If a string is passed, it will be used as the query key.
  - If an array is passed, each item will be serialized into a stable query key. See [Query Keys](./guides/queries#query-keys) for more information.
  - The query will automatically update when this key changes (as long as `enabled` is not set to `false`).
- `queryFn: Function(variables) => Promise(data/error)`
  - **Required, but only if no default query function has been defined**
  - The function that the query will use to request data.
  - Receives the following variables in the order that they are provided:
    - Query Key Variables
  - Must return a promise that will either resolves data or throws an error.
- `enabled: Boolean | unknown`
  - Set this to `false` to disable this query from automatically running.
  - Actually it can be anything that will pass a boolean condition. See [Dependent Queries](./guides/queries#dependent-queries) for more information.
- `retry: Boolean | Int | Function(failureCount, error) => shouldRetry | Boolean`
  - If `false`, failed queries will not retry by default.
  - If `true`, failed queries will retry infinitely.
  - If set to an `Int`, e.g. `3`, failed queries will retry until the failed query count meets that number.
- `retryDelay: Function(retryAttempt: Int) => Int`
  - This function receives a `retryAttempt` integer and returns the delay to apply before the next attempt in milliseconds.
  - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff.
  - A function like `attempt => attempt * 1000` applies linear backoff.
- `staleTime: Int | Infinity`
  - The time in milliseconds after data is considered stale.
  - If set to `Infinity`, query will never go stale
- `cacheTime: Int | Infinity`
  - The time in milliseconds that unused/inactive cache data remains in memory. When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
  - If set to `Infinity`, will disable garbage collection
- `refetchInterval: false | Integer`
  - Optional
  - If set to a number, all queries will continuously refetch at this frequency in milliseconds
- `refetchIntervalInBackground: Boolean`
  - Optional
  - If set to `true`, queries that are set to continuously refetch with a `refetchInterval` will continue to refetch while their tab/window is in the background
- `refetchOnMount: boolean | "always"`
  - Optional
  - Defaults to `true`
  - If set to `true`, the query will refetch on mount if the data is stale.
  - If set to `false`, will disable additional instances of a query to trigger background refetches.
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
- `notifyOnStatusChange: Boolean`
  - Optional
  - Set this to `false` to only re-render when there are changes to `data` or `error`.
  - Defaults to `true`.
- `onSuccess: Function(data) => data`
  - Optional
  - This function will fire any time the query successfully fetches new data.
- `onError: Function(err) => void`
  - Optional
  - This function will fire if the query encounters an error and will be passed the error.
- `onSettled: Function(data, error) => data`
  - Optional
  - This function will fire any time the query is either successfully fetched or errors and be passed either the data or error
- `suspense: Boolean`
  - Optional
  - Set this to `true` to enable suspense mode.
  - When `true`, `useQuery` will suspend when `status === 'loading'`
  - When `true`, `useQuery` will throw runtime errors when `status === 'error'`
- `initialData: any | Function() => any`
  - Optional
  - If set, this value will be used as the initial data for the query cache (as long as the query hasn't been created or cached yet)
  - If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initialData
- `initialStale: Boolean | Function() => Boolean`
  - Optional
  - If set, this will mark any `initialData` provided as stale and will likely cause it to be refetched on mount
  - If a function is passed, it will be called only when appropriate to resolve the `initialStale` value. This can be useful if your `initialStale` value is costly to calculate.
  - `initialData` **is persisted** to the cache
- `placeholderData: any | Function() => any`
  - Optional
  - If set, this value will be used as the placeholder data for this particular query instance while the query is still in the `loading` data and no initialData has been provided.
  - If set to a function, the function will be called **once** during the shared/root query initialization, and be expected to synchronously return the initialData
  - `placeholderData` is **not persisted** to the cache
- `keepPreviousData: Boolean`
  - Optional
  - Defaults to `false`
  - If set, any previous `data` will be kept when fetching new data because the query key changed.
- `queryFnParamsFilter: Function(args) => filteredArgs`
  - Optional
  - This function will filter the params that get passed to `queryFn`.
  - For example, you can filter out the first query key from the params by using `queryFnParamsFilter: args => args.slice(1)`.
- `structuralSharing: Boolean`
  - Optional
  - Defaults to `true`
  - If set to `false`, structural sharing between query results will be disabled.

**Returns**

- `status: String`
  - Will be:
    - `idle` if the query is idle. This only happens if a query is initialized with `enabled: false` and no initial data is available.
    - `loading` if the query is in a "hard" loading state. This means there is no cached data and the query is currently fetching, eg `isFetching === true`
    - `error` if the query attempt resulted in an error. The corresponding `error` property has the error received from the attempted fetch
    - `success` if the query has received a response with no errors and is ready to display its data. The corresponding `data` property on the query is the data received from the successful fetch or if the query's `enabled` property is set to `false` and has not been fetched yet `data` is the first `initialData` supplied to the query on initialization.
- `isIdle: Boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- `isLoading: Boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- `isSuccess: Boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- `isError: Boolean`
  - A derived boolean from the `status` variable above, provided for convenience.
- `data: Any`
  - Defaults to `undefined`.
  - The last successfully resolved data for the query.
- `error: null | Error`
  - Defaults to `null`
  - The error object for the query, if an error was thrown.
- `isStale: Boolean`
  - Will be `true` if the cache data is stale.
- `isPreviousData: Boolean`
  - Will be `true` when `keepPreviousData` is set and data from the previous query is returned.
- `isPlaceholderData: Boolean`
  - Will be `true` if and when the query's `data` is equal to the result of the `placeholderData` option.
- `isFetchedAfterMount: Boolean`
  - Will be `true` if the query has been fetched after the component mounted.
  - This property can be used to not show any previously cached data.
- `isFetching: Boolean`
  - Defaults to `true` so long as `enabled` is set to `false`
  - Will be `true` if the query is currently fetching, including background fetching.
- `failureCount: Integer`
  - The failure count for the query.
  - Incremented every time the query fails.
  - Reset to `0` when the query succeeds.
- `refetch: Function({ throwOnError }) => Promise<TResult | undefined>`
  - A function to manually refetch the query.
  - If the query errors, the error will only be logged. If you want an error to be thrown, pass the `throwOnError: true` option
- `remove: Function() => void`
  - A function to remove the query from the cache.

## `usePaginatedQuery`

```js
const {
  data = undefined,
  resolvedData,
  latestData,
  ...queryInfo
} = usePaginatedQuery(queryKey, queryFn, options)
```

**Options**

The options for `usePaginatedQuery` are identical to the [`useQuery` hook](#usequery)

**Returns**

The returned properties for `usePaginatedQuery` are identical to the [`useQuery` hook](#usequery), with the addition of the following:

- `data: undefined`
  - The standard `data` property is not used for paginated queries and is replaced by the `resolvedData` and `latestData` options below.
- `resolvedData: Any`
  - Defaults to `undefined`.
  - The last successfully resolved data for the query.
  - When fetching based on a new query key, the value will resolve to the last known successful value, regardless of query key
- `latestData: Any`
  - Defaults to `undefined`.
  - The actual data object for this query and its specific query key
  - When fetching an uncached query, this value will be `undefined`

## `useInfiniteQuery`

```js

const queryFn = (...queryKey, fetchMoreVariable) // => Promise

const {
  isFetchingMore,
  fetchMore,
  canFetchMore,
  ...queryInfo
} = useInfiniteQuery(queryKey, queryFn, {
  ...queryOptions,
  getFetchMore: (lastPage, allPages) => fetchMoreVariable
})
```

**Options**

The options for `useInfiniteQuery` are identical to the [`useQuery` hook](#usequery) with the addition of the following:

- `getFetchMore: Function(lastPage, allPages) => fetchMoreVariable | Boolean`
  - When new data is received for this query, this function receives both the last page of the infinite list of data and the full array of all pages.
  - It should return a **single variable** that will be passed as the last optional parameter to your query function

**Returns**

The returned properties for `useInfiniteQuery` are identical to the [`useQuery` hook](#usequery), with the addition of the following:

- `isFetchingMore: false | 'next' | 'previous'`
  - If using `paginated` mode, this will be `true` when fetching more results using the `fetchMore` function.
- `fetchMore: Function(fetchMoreVariableOverride) => Promise<TResult | undefined>`
  - This function allows you to fetch the next "page" of results.
  - `fetchMoreVariableOverride` allows you to optionally override the fetch more variable returned from your `getFetchMore` option to your query function to retrieve the next page of results.
- `canFetchMore: Boolean`
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

- `mutationFn: Function(variables) => Promise`
  - **Required**
  - A function that performs an asynchronous task and returns a promise.
  - `variables` is an object that `mutate` will pass to your `mutationFn`
- `onMutate: Function(variables) => Promise | snapshotValue`
  - Optional
  - This function will fire before the mutation function is fired and is passed the same variables the mutation function would receive
  - Useful to perform optimistic updates to a resource in hopes that the mutation succeeds
  - The value returned from this function will be passed to both the `onError` and `onSettled` functions in the event of a mutation failure and can be useful for rolling back optimistic updates.
- `onSuccess: Function(data, variables) => Promise | undefined`
  - Optional
  - This function will fire when the mutation is successful and will be passed the mutation's result.
  - Fires after the `mutate`-level `onSuccess` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onError: Function(err, variables, onMutateValue) => Promise | undefined`
  - Optional
  - This function will fire if the mutation encounters an error and will be passed the error.
  - Fires after the `mutate`-level `onError` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onSettled: Function(data, error, variables, onMutateValue) => Promise | undefined`
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

- `mutate: Function(variables, { onSuccess, onSettled, onError, throwOnError }) => Promise`
  - The mutation function you can call with variables to trigger the mutation and optionally override the original mutation options.
  - `variables: any`
    - Optional
    - The variables object to pass to the `mutationFn`.
  - Remaining options extend the same options described above in the `useMutation` hook.
  - Lifecycle callbacks defined here will fire **after** those of the same type defined in the `useMutation`-level options.
- `status: String`
  - Will be:
    - `idle` initial status prior to the mutation function executing.
    - `loading` if the mutation is currently executing.
    - `error` if the last mutation attempt resulted in an error.
    - `success` if the last mutation attempt was successful.
- `isIdle`, `isLoading`, `isSuccess`, `isError`: boolean variables derived from `status`
- `data: undefined | Any`
  - Defaults to `undefined`
  - The last successfully resolved data for the query.
- `error: null | Error`
  - The error object for the query, if an error was encountered.
- `reset: Function() => void`
  - A function to clean the mutation internal state (i.e., it resets the mutation to its initial state).

## `QueryCache`

The `QueryCache` is the backbone of React Query that manages all of the state, caching, lifecycle and magic of every query. It supports relatively unrestricted, but safe, access to manipulate query's as you need.

```js
import { QueryCache } from 'react-query'

const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      staleTime: Infinity,
    },
  },
})
```

Its available properties and methods are:

- [`fetchQuery`](#querycachefetchquery)
- [`prefetchQuery`](#querycacheprefetchquery)
- [`getQueryData`](#querycachegetquerydata)
- [`setQueryData`](#querycachesetquerydata)
- [`refetchQueries`](#querycacherefetchqueries)
- [`invalidateQueries`](#querycacheinvalidatequeries)
- [`cancelQueries`](#querycachecancelqueries)
- [`removeQueries`](#querycacheremovequeries)
- [`getQuery`](#querycachegetquery)
- [`getQueries`](#querycachegetqueries)
- [`isFetching`](#querycacheisfetching)
- [`subscribe`](#querycachesubscribe)
- [`clear`](#querycacheclear)

**Options**

- `defaultConfig: QueryQueryConfig`
  - Optional
  - Define defaults for all queries and mutations using this query cache.

## `queryCache.fetchQuery`

`fetchQuery` is an asynchronous method that can be used to fetch and cache a query. It will either resolve with the data or throw with the error. Specify a `staleTime` to only trigger a fetch when the data is stale. Use the `prefetchQuery` method if you just want to fetch a query without needing the result.

```js
try {
  const data = await queryCache.fetchQuery(queryKey, queryFn)
} catch (error) {
  console.log(error)
}
```

**Returns**

- `Promise<TResult>`

## `queryCache.prefetchQuery`

`prefetchQuery` is an asynchronous method that can be used to fetch and cache a query response before it is needed or rendered with `useQuery` and friends.

- If either:
  - The query does not exist or
  - The query exists but the data is stale
    - The queryFn will be called, the data resolved, the cache populated and the data returned via promise.
- If you want to force the query to prefetch regardless of the data being stale, you can pass the `force: true` option in the options object
- If the query exists, and the data is NOT stale, the existing data in the cache will be returned via promise

> The difference between using `prefetchQuery` and `setQueryData` is that `prefetchQuery` is async and will ensure that duplicate requests for this query are not created with `useQuery` instances for the same query are rendered while the data is fetching.

```js
await queryCache.prefetchQuery(queryKey, queryFn)
```

To pass options like `force` or `throwOnError`, use the fourth options object:

```js
await queryCache.prefetchQuery(queryKey, queryFn, config, {
  force: true,
  throwOnError: true,
})
```

You can even use it with a default queryFn in your config!

```js
await queryCache.prefetchQuery(queryKey)
```

**Options**

The options for `prefetchQuery` are exactly the same as those of [`useQuery`](#usequery) with the exception of the last options object:

- `force: Boolean`
  - Set this `true` if you want `prefetchQuery` to fetch the data even if the data exists and is NOT stale.
- `throwOnError: Boolean`
  - Set this `true` if you want `prefetchQuery` to throw an error when it encounters errors.

**Returns**

- `Promise<TResult | undefined>`
  - A promise is returned that will either immediately resolve with the query's cached response data, or resolve to the data returned by the fetch function. It **will not** throw an error if the fetch fails. This can be configured by setting the `throwOnError` option to `true`.

## `queryCache.getQueryData`

`getQueryData` is a synchronous function that can be used to get an existing query's cached data. If the query does not exist, `undefined` will be returned.

```js
const data = queryCache.getQueryData(queryKey)
```

**Options**

- `queryKey: QueryKey`
  - See [Query Keys](./guides/queries#query-keys) for more information on how to construct and use a query key

**Returns**

- `data: any | undefined`
  - The data for the cached query, or `undefined` if the query does not exist.

## `queryCache.setQueryData`

`setQueryData` is a synchronous function that can be used to immediately update a query's cached data. If the query does not exist, it will be created and immediately be marked as stale. **If the query is not utilized by a query hook in the default `cacheTime` of 5 minutes, the query will be garbage collected**.

> The difference between using `setQueryData` and `prefetchQuery` is that `setQueryData` is sync and assumes that you already synchronously have the data available. If you need to fetch the data asynchronously, it's suggested that you either refetch the query key or use `prefetchQuery` to handle the asynchronous fetch.

```js
queryCache.setQueryData(queryKey, updater, config)
```

**Options**

- `queryKey: QueryKey`
  - See [Query Keys](./guides/queries#query-keys) for more information on how to construct and use a query key
- `updater: Any | Function(oldData) => newData`
  - If non-function is passed, the data will be updated to this value
  - If a function is passed, it will receive the old data value and be expected to return a new one.
- `config: object`
  - The standard query config object use in [`useQuery`](#usequery)

**Using an updater value**

```js
setQueryData(queryKey, newData)
```

**Using an updater function**

For convenience in syntax, you can also pass an updater function which receives the current data value and returns the new one:

```js
setQueryData(queryKey, oldData => newData)
```

## `queryCache.refetchQueries`

The `refetchQueries` method can be used to refetch queries based on certain conditions.

Examples:

```js
// refetch all queries:
await queryCache.refetchQueries()

// refetch all stale queries:
await queryCache.refetchQueries([], { stale: true })

// refetch all stale and active queries:
await queryCache.refetchQueries([], { stale: true, active: true })

// refetch all queries partially matching a query key:
await queryCache.refetchQueries(['posts'])

// refetch all queries exactly matching a query key:
await queryCache.refetchQueries(['posts', 1], { exact: true })
```

**Options**

- `queryKeyOrPredicateFn` can either be a [Query Key](#query-keys) or a `Function`
  - `queryKey: QueryKey`
    - If a query key is passed, queries will be filtered to those where this query key is included in the existing query's query key. This means that if you passed a query key of `'todos'`, it would match queries with the `todos`, `['todos']`, and `['todos', 5]`. See [Query Keys](./guides/queries#query-keys) for more information.
  - `query => boolean`
    - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
    - The `exact` option has no effect when using a function
- `exact?: boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed. Remember to destructure it out of the array!
- `active?: boolean`
  - When set to `true` it will refetch active queries.
  - When set to `false` it will refetch inactive queries.
- `stale?: boolean`
  - When set to `true` it will match on stale queries.
  - When set to `false` it will match on fresh queries.
- `throwOnError?: boolean`
  - When set to `true`, this method will throw if any of the query refetch tasks fail.

**Returns**

This function returns a promise that will resolve when all of the queries are done being refetched. By default, it **will not** throw an error if any of those queries refetches fail, but this can be configured by setting the `throwOnError` option to `true`

## `queryCache.invalidateQueries`

The `invalidateQueries` method can be used to invalidate and refetch single or multiple queries in the cache based on their query keys or any other functionally accessible property/state of the query. By default, all matching queries are immediately marked as stale and active queries are refetched in the background.

- If you **do not want active queries to refetch**, and simply be marked as stale, you can use the `refetchActive: false` option.
- If you **want inactive queries to refetch** as well, use the `refetchInactive: true` option

```js
const queries = queryCache.invalidateQueries(inclusiveQueryKeyOrPredicateFn, {
  exact,
  throwOnError,
  refetchActive = true,
  refetchInactive = false
})
```

**Options**

- `queryKeyOrPredicateFn` can either be a [Query Key](#query-keys) or a `function`
  - `queryKey: QueryKey`
    - If a query key is passed, queries will be filtered to those where this query key is included in the existing query's query key. This means that if you passed a query key of `'todos'`, it would match queries with the `todos`, `['todos']`, and `['todos', 5]`. See [Query Keys](./guides/queries#query-keys) for more information.
  - `Function(query) => Boolean`
    - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
    - The `exact` option has no effect with using a function
- `exact: Boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed. Remember to destructure it out of the array!
- `throwOnError: Boolean`
  - When set to `true`, this function will throw if any of the query refetch tasks fail.
- `refetchActive: Boolean`
  - Defaults to `true`
  - When set to `false`, queries that match the refetch predicate and are actively being rendered via `useQuery` and friends will NOT be refetched in the background, and only marked as stale.
- `refetchInactive: Boolean`
  - Defaults to `false`
  - When set to `true`, queries that match the refetch predicate and are not being rendered via `useQuery` and friends will be both marked as stale and also refetched in the background

**Returns**

This function returns a promise that will resolve when all of the queries are done being refetched. By default, it **will not** throw an error if any of those queries refetches fail, but this can be configured by setting the `throwOnError` option to `true`

## `queryCache.cancelQueries`

The `cancelQueries` method can be used to cancel outgoing queries based on their query keys or any other functionally accessible property/state of the query.

This is most useful when performing optimistic updates since you will likely need to cancel any outgoing query refetches so they don't clobber your optimistic update when they resolve.

```js
queryCache.cancelQueries(queryKeyOrPredicateFn, {
  exact,
})
```

**Options**

- `queryKeyOrPredicateFn` can either be a [Query Key](#query-keys) or a `function`
  - `queryKey`
    - If a query key is passed, queries will be filtered to those where this query key is included in the existing query's query key. This means that if you passed a query key of `'todos'`, it would match queries with the `todos`, `['todos']`, and `['todos', 5]`. See [Query Keys](./guides/queries#query-keys) for more information.
  - `Function(query) => Boolean`
    - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
    - The `exact` option has no effect with using a function
- `exact: Boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed. Remember to destructure it out of the array!

**Returns**

This function does not return anything

## `queryCache.removeQueries`

The `removeQueries` method can be used to remove queries from the cache based on their query keys or any other functionally accessible property/state of the query.

```js
queryCache.removeQueries(queryKeyOrPredicateFn, {
  exact,
})
```

**Options**

- `queryKeyOrPredicateFn` can either be a [Query Key](#query-keys) or a `function`
  - `queryKey`
    - If a query key is passed, queries will be filtered to those where this query key is included in the existing query's query key. This means that if you passed a query key of `'todos'`, it would match queries with the `todos`, `['todos']`, and `['todos', 5]`. See [Query Keys](./guides/queries#query-keys) for more information.
  - `Function(query) => Boolean`
    - This predicate function will be called for every single query in the cache and be expected to return truthy for queries that are `found`.
    - The `exact` option has no effect with using a function
- `exact: Boolean`
  - If you don't want to search queries inclusively by query key, you can pass the `exact: true` option to return only the query with the exact query key you have passed. Remember to destructure it out of the array!

**Returns**

This function does not return anything

## `queryCache.getQuery`

`getQuery` is a slightly more advanced synchronous function that can be used to get an existing query object from the cache. This object not only contains **all** the state for the query, but all of the instances, and underlying guts of the query as well. If the query does not exist, `undefined` will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios (eg. Looking at the query.state.updatedAt timestamp to decide whether a query is fresh enough to be used as an initial value)

```js
const query = queryCache.getQuery(queryKey)
```

**Options**

- `queryKey: QueryKey`
  - See [Query Keys](./guides/queries#query-keys) for more information on how to construct and use a query key

**Returns**

- `query: QueryObject`
  - The query object from the cache

## `queryCache.getQueries`

`getQueries` is even more advanced synchronous function that can be used to get existing query objects from the cache that partially match query key. If queries do not exist, empty array will be returned.

> Note: This is not typically needed for most applications, but can come in handy when needing more information about a query in rare scenarios

```js
const queries = queryCache.getQueries(queryKey)
```

**Options**

- `queryKey: QueryKey`
  - See [Query Keys](./guides/queries#query-keys) for more information on how to construct and use a query key

**Returns**

- `queries: QueryObject[]`
  - Query objects from the cache

## `queryCache.isFetching`

This `isFetching` property is an `integer` representing how many queries, if any, in the cache are currently fetching (including background-fetching, loading new pages, or loading more infinite query results)

```js
if (queryCache.isFetching) {
  console.log('At least one query is fetching!')
}
```

React Query also exports a handy [`useIsFetching`](#useisfetching) hook that will let you subscribe to this state in your components without creating a manual subscription to the query cache.

## `queryCache.subscribe`

The `subscribe` method can be used to subscribe to the query cache as a whole and be informed of safe/known updates to the cache like query states changing or queries being updated, added or removed

```js
const callback = (cache, query) => {}

const unsubscribe = queryCache.subscribe(callback)
```

**Options**

- `callback: Function(queryCache, query?) => void`
  - This function will be called with the query cache any time it is updated via its tracked update mechanisms (eg, `query.setState`, `queryCache.removeQueries`, etc). Out of scope mutations to the queryCache are not encouraged and will not fire subscription callbacks
  - Additionally, for updates to the cache triggered by a specific query, the `query` will be passed as the second argument to the callback

**Returns**

- `unsubscribe: Function => void`
  - This function will unsubscribe the callback from the query cache.

## `queryCache.clear`

The `clear` method can be used to clear the queryCache entirely and start fresh.

```js
queryCache.clear()
```

**Returns**

- `queries: Array<Query>`
  - This will be an array containing the queries that were found.

## `makeQueryCache`

The `makeQueryCache` factory function has been deprecated in favor of `new QueryCache()`.

## `useQueryCache`

The `useQueryCache` hook returns the current queryCache instance.

```js
import { useQueryCache } from 'react-query'

const queryCache = useQueryCache()
```

## `useIsFetching`

`useIsFetching` is an optional hook that returns the `number` of the queries that your application is loading or fetching in the background (useful for app-wide loading indicators).

```js
import { useIsFetching } from 'react-query'

const isFetching = useIsFetching()
```

**Returns**

- `isFetching: Int`
  - Will be the `number` of the queries that your application is currently loading or fetching in the background.

## `ReactQueryConfigProvider`

`ReactQueryConfigProvider` is an optional provider component and can be used to define defaults for all instances of `useQuery` within it's sub-tree:

```js
import {
  QueryCache,
  ReactQueryCacheProvider,
  ReactQueryConfigProvider,
} from 'react-query'

const queryCache = new QueryCache({
  defaultConfig: {
    queries: {
      suspense: false,
      queryKeySerializerFn: defaultQueryKeySerializerFn,
      queryFn,
      enabled: true,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchInterval: false,
      queryFnParamsFilter: identity,
      refetchOnMount: true,
      isDataEqual: deepEqual,
      onError: noop,
      onSuccess: noop,
      onSettled: noop,
      useErrorBoundary: false, // falls back to suspense
    },
    mutations: {
      suspense: false,
      throwOnError: false,
      onMutate: noop,
      onError: noop,
      onSuccess: noop,
      onSettled: noop,
      useErrorBoundary: false, // falls back to suspense
    },
  },
})

const overrides = {
  queries: {
    suspense: true,
  },
  mutations: {
    suspense: true,
  },
}

function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      ...
      <ReactQueryConfigProvider config={overrides}>
        ...
      </ReactQueryConfigProvider>
    </ReactQueryCacheProvider>
  )
}
```

**Options**

- `config: Object`
  - Must be **stable** or **memoized**. Do not create an inline object!
  - For non-global properties please see their usage in both the [`useQuery` hook](#usequery) and the [`useMutation` hook](#usemutation).

## `ReactQueryCacheProvider`

The query cache can be connected to React with the `ReactQueryCacheProvider`. This component puts the cache on the context, which enables you to access it from anywhere in your component tree.

```js
import { ReactQueryCacheProvider, QueryCache } from 'react-query'

const queryCache = new QueryCache()

function App() {
  return (
    <ReactQueryCacheProvider queryCache={queryCache}>
      ...
    </ReactQueryCacheProvider>
  )
}
```

**Options**

- `queryCache: QueryCache`
  - Instance of QueryCache.

## `ReactQueryErrorResetBoundary`

When using **suspense** or **useErrorBoundaries** in your queries, you need a way to let queries know that you want to try again when re-rendering after some error occured. With the `ReactQueryErrorResetBoundary` component you can reset any query errors within the boundaries of the component.

```js
import { ReactQueryErrorResetBoundary } from 'react-query'
import { ErrorBoundary } from 'react-error-boundary'

const App: React.FC = () => (
  <ReactQueryErrorResetBoundary>
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
  </ReactQueryErrorResetBoundary>
)
```

## `useErrorResetBoundary`

This hook will reset any query errors within the closest `ReactQueryErrorResetBoundary`. If there is no boundary defined it will reset them globally:

```js
import { useErrorResetBoundary } from 'react-query'
import { ErrorBoundary } from 'react-error-boundary'

const App: React.FC = () => {
  const { reset } = useErrorResetBoundary()
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

`dehydrate` creates a frozen representation of a `queryCache` that can later be hydrated with `useHydrate`, `hydrate` or `Hydrate`. This is useful for passing prefetched queries from server to client or persisting queries to localstorage. It only includes currently successful queries by default.

```js
import { dehydrate } from 'react-query/hydration'

const dehydratedState = dehydrate(queryCache, {
  shouldDehydrate,
})
```

**Options**

- `queryCache: QueryCache`
  - **Required**
  - The `queryCache` that should be dehydrated
- `shouldDehydrate: Function(query: Query) => Boolean`
  - This function is called for each query in the cache
  - Return `true` to include this query in dehydration, or `false` otherwise
  - Default version only includes successful queries, do `shouldDehydrate: () => true` to include all queries

**Returns**

- `dehydratedState: DehydratedState`
  - This includes everything that is needed to hydrate the `queryCache` at a later point
  - You **should not** rely on the exact format of this response, it is not part of the public API and can change at any time
  - This result is not in serialized form, you need to do that yourself if desired

## `hydration/hydrate`

`hydrate` adds a previously dehydrated state into a `queryCache`. If the queries included in dehydration already exist in the cache, `hydrate` does not overwrite them.

```js
import { hydrate } from 'react-query/hydration'

hydrate(queryCache, dehydratedState)
```

**Options**

- `queryCache: QueryCache`
  - **Required**
  - The `queryCache` to hydrate the state into
- `dehydratedState: DehydratedState`
  - **Required**
  - The state to hydrate into the cache

## `hydration/useHydrate`

`useHydrate` adds a previously dehydrated state into the `queryCache` returned by `useQueryCache`.

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
