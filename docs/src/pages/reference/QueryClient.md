---
id: QueryClient
title: QueryClient
---

## `QueryClient`

The `QueryClient` can be used to interact with a cache:

```js
import { QueryClient } from 'react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

await queryClient.prefetchQuery('posts', fetchPosts)
```

Its available methods are:

- [`fetchQuery`](#queryclientfetchquery)
- [`fetchInfiniteQuery`](#queryclientfetchinfinitequery)
- [`prefetchQuery`](#queryclientprefetchquery)
- [`prefetchInfiniteQuery`](#queryclientprefetchinfinitequery)
- [`getQueryData`](#queryclientgetquerydata)
- [`setQueryData`](#queryclientsetquerydata)
- [`setQueriesData`](#queryclientsetqueriesdata)
- [`getQueryState`](#queryclientgetquerystate)
- [`invalidateQueries`](#queryclientinvalidatequeries)
- [`refetchQueries`](#queryclientrefetchqueries)
- [`cancelQueries`](#queryclientcancelqueries)
- [`removeQueries`](#queryclientremovequeries)
- [`resetQueries`](#queryclientresetqueries)
- [`isFetching`](#queryclientisfetching)
- [`isMutating`](#queryclientismutating)
- [`getDefaultOptions`](#queryclientsetdefaultoptions)
- [`setDefaultOptions`](#queryclientgetdefaultoptions)
- [`getQueryDefaults`](#queryclientgetquerydefaults)
- [`setQueryDefaults`](#queryclientsetquerydefaults)
- [`getMutationDefaults`](#queryclientgetmutationdefaults)
- [`setMutationDefaults`](#queryclientsetmutationdefaults)
- [`getQueryCache`](#queryclientgetquerycache)
- [`getMutationCache`](#queryclientgetmutationcache)
- [`clear`](#queryclientclear)

**Options**

- `queryCache?: QueryCache`
  - Optional
  - The query cache this client is connected to.
- `mutationCache?: MutationCache`
  - Optional
  - The mutation cache this client is connected to.
- `defaultOptions?: DefaultOptions`
  - Optional
  - Define defaults for all queries and mutations using this queryClient.

## `queryClient.fetchQuery`

`fetchQuery` is an asynchronous method that can be used to fetch and cache a query. It will either resolve with the data or throw with the error. Use the `prefetchQuery` method if you just want to fetch a query without needing the result.

If the query exists and the data is not invalidated or older than the given `staleTime`, then the data from the cache will be returned. Otherwise it will try to fetch the latest data.

> The difference between using `fetchQuery` and `setQueryData` is that `fetchQuery` is async and will ensure that duplicate requests for this query are not created with `useQuery` instances for the same query are rendered while the data is fetching.

```js
try {
  const data = await queryClient.fetchQuery(queryKey, queryFn)
} catch (error) {
  console.log(error)
}
```

Specify a `staleTime` to only fetch when the data is older than a certain amount of time:

```js
try {
  const data = await queryClient.fetchQuery(queryKey, queryFn, {
    staleTime: 10000,
  })
} catch (error) {
  console.log(error)
}
```

**Options**

The options for `fetchQuery` are exactly the same as those of [`useQuery`](./useQuery), except the following: `enabled, refetchInterval, refetchIntervalInBackground, refetchOnWindowFocus, refetchOnReconnect, notifyOnChangeProps, notifyOnChangePropsExclusions, onSuccess, onError, onSettled, useErrorBoundary, select, suspense, keepPreviousData, placeholderData`; which are stictly for useQuery and useInfiniteQuery. You can check the [source code](https://github.com/tannerlinsley/react-query/blob/361935a12cec6f36d0bd6ba12e84136c405047c5/src/core/types.ts#L83) for more clarity.

**Returns**

- `Promise<TData>`

## `queryClient.fetchInfiniteQuery`

`fetchInfiniteQuery` is similar to `fetchQuery` but can be used to fetch and cache an infinite query.

```js
try {
  const data = await queryClient.fetchInfiniteQuery(queryKey, queryFn)
  console.log(data.pages)
} catch (error) {
  console.log(error)
}
```

**Options**

The options for `fetchInfiniteQuery` are exactly the same as those of [`fetchQuery`](#queryclientfetchquery).

**Returns**

- `Promise<InfiniteData<TData>>`

## `queryClient.prefetchQuery`

`prefetchQuery` is an asynchronous method that can be used to prefetch a query before it is needed or rendered with `useQuery` and friends. The method works the same as `fetchQuery` except that it will not throw or return any data.

```js
await queryClient.prefetchQuery(queryKey, queryFn)
```

You can even use it with a default queryFn in your config!

```js
await queryClient.prefetchQuery(queryKey)
```

**Options**

The options for `prefetchQuery` are exactly the same as those of [`fetchQuery`](#queryclientfetchquery).

**Returns**

- `Promise<void>`
  - A promise is returned that will either immediately resolve if no fetch is needed or after the query has been executed. It will not return any data or throw any errors.

## `queryClient.prefetchInfiniteQuery`

`prefetchInfiniteQuery` is similar to `prefetchQuery` but can be used to prefetch and cache an infinite query.

```js
await queryClient.prefetchInfiniteQuery(queryKey, queryFn)
```

**Options**

The options for `prefetchInfiniteQuery` are exactly the same as those of [`fetchQuery`](#queryclientfetchquery).

**Returns**

- `Promise<void>`
  - A promise is returned that will either immediately resolve if no fetch is needed or after the query has been executed. It will not return any data or throw any errors.

## `queryClient.getQueryData`

`getQueryData` is a synchronous function that can be used to get an existing query's cached data. If the query does not exist, `undefined` will be returned.

```js
const data = queryClient.getQueryData(queryKey)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)

**Returns**

- `data: TData | undefined`
  - The data for the cached query, or `undefined` if the query does not exist.

## `queryClient.setQueryData`

`setQueryData` is a synchronous function that can be used to immediately update a query's cached data. If the query does not exist, it will be created. **If the query is not utilized by a query hook in the default `cacheTime` of 5 minutes, the query will be garbage collected**.

> The difference between using `setQueryData` and `fetchQuery` is that `setQueryData` is sync and assumes that you already synchronously have the data available. If you need to fetch the data asynchronously, it's suggested that you either refetch the query key or use `fetchQuery` to handle the asynchronous fetch.

```js
queryClient.setQueryData(queryKey, updater)
```

**Options**

- `queryKey: QueryKey`: [Query Keys](../guides/query-keys)
- `updater: TData | (oldData: TData | undefined) => TData`
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

## `queryClient.getQueryState`

`getQueryState` is a synchronous function that can be used to get an existing query's state. If the query does not exist, `undefined` will be returned.

```js
const state = queryClient.getQueryState(queryKey)
console.log(state.dataUpdatedAt)
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)

## `queryClient.setQueriesData`

`setQueriesData` is a synchronous function that can be used to immediately update cached data of multiple queries. Only queries that match the passed queryKey or queryFilter will be updated - no new cache entries will be created. Under the hood, [`setQueryData`](#queryclientsetquerydata) is called for each query.

```js
queryClient.setQueriesData(queryKey | filters, updater)
```

**Options**

- `queryKey: QueryKey`: [Query Keys](../guides/query-keys) | `filters: QueryFilters`: [Query Filters](../guides/filters#query-filters)
  - if a queryKey is passed as first argument, queryKeys fuzzily matching this param will be updated
  - if a filter is passed, queryKeys matching the filter will be updated
- `updater: TData | (oldData: TData | undefined) => TData`
  - the [setQueryData](#queryclientsetquerydata) updater function or new data, will be called for each matching queryKey

## `queryClient.invalidateQueries`

The `invalidateQueries` method can be used to invalidate and refetch single or multiple queries in the cache based on their query keys or any other functionally accessible property/state of the query. By default, all matching queries are immediately marked as invalid and active queries are refetched in the background.

- If you **do not want active queries to refetch**, and simply be marked as invalid, you can use the `refetchActive: false` option.
- If you **want inactive queries to refetch** as well, use the `refetchInactive: true` option

```js
await queryClient.invalidateQueries('posts', {
  exact,
  refetchActive: true,
  refetchInactive: false
}, { throwOnError })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)
  - `refetchActive: Boolean`
    - Defaults to `true`
    - When set to `false`, queries that match the refetch predicate and are actively being rendered via `useQuery` and friends will NOT be refetched in the background, and only marked as invalid.
  - `refetchInactive: Boolean`
    - Defaults to `false`
    - When set to `true`, queries that match the refetch predicate and are not being rendered via `useQuery` and friends will be both marked as invalid and also refetched in the background
- `refetchOptions?: RefetchOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.

## `queryClient.refetchQueries`

The `refetchQueries` method can be used to refetch queries based on certain conditions.

Examples:

```js
// refetch all queries:
await queryClient.refetchQueries()

// refetch all stale queries:
await queryClient.refetchQueries({ stale: true })

// refetch all active queries partially matching a query key:
await queryClient.refetchQueries(['posts'], { active: true })

// refetch all active queries exactly matching a query key:
await queryClient.refetchQueries(['posts', 1], { active: true, exact: true })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)
- `refetchOptions?: RefetchOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.

**Returns**

This function returns a promise that will resolve when all of the queries are done being refetched. By default, it **will not** throw an error if any of those queries refetches fail, but this can be configured by setting the `throwOnError` option to `true`

## `queryClient.cancelQueries`

The `cancelQueries` method can be used to cancel outgoing queries based on their query keys or any other functionally accessible property/state of the query.

This is most useful when performing optimistic updates since you will likely need to cancel any outgoing query refetches so they don't clobber your optimistic update when they resolve.

```js
await queryClient.cancelQueries('posts', { exact: true })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)

**Returns**

This method does not return anything

## `queryClient.removeQueries`

The `removeQueries` method can be used to remove queries from the cache based on their query keys or any other functionally accessible property/state of the query.

```js
queryClient.removeQueries(queryKey, { exact: true })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)

**Returns**

This method does not return anything

## `queryClient.resetQueries`

The `resetQueries` method can be used to reset queries in the cache to their
initial state based on their query keys or any other functionally accessible
property/state of the query.

This will notify subscribers &mdash; unlike `clear`, which removes all
subscribers &mdash; and reset the query to its pre-loaded state &mdash; unlike
`invalidateQueries`. If a query has `initialData`, the query's data will be
reset to that. If a query is active, it will be refetched.

```js
queryClient.resetQueries(queryKey, { exact: true })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)
- `resetOptions?: ResetOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.

**Returns**

This method returns a promise that resolves when all active queries have been refetched.

## `queryClient.isFetching`

This `isFetching` method returns an `integer` representing how many queries, if any, in the cache are currently fetching (including background-fetching, loading new pages, or loading more infinite query results)

```js
if (queryClient.isFetching()) {
  console.log('At least one query is fetching!')
}
```

React Query also exports a handy [`useIsFetching`](./useIsFetching) hook that will let you subscribe to this state in your components without creating a manual subscription to the query cache.

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/filters#query-filters)

**Returns**

This method returns the number of fetching queries.

## `queryClient.isMutating`

This `isMutating` method returns an `integer` representing how many mutations, if any, in the cache are currently fetching.

```js
if (queryClient.isMutating()) {
  console.log('At least one mutation is fetching!')
}
```

React Query also exports a handy [`useIsMutating`](./useIsMutating) hook that will let you subscribe to this state in your components without creating a manual subscription to the mutation cache.

**Options**

- `filters: MutationFilters`: [Mutation Filters](../guides/filters#mutation-filters)

**Returns**

This method returns the number of fetching mutations.
## `queryClient.getDefaultOptions`

The `getDefaultOptions` method returns the default options which have been set when creating the client or with `setDefaultOptions`.

```js
const defaultOptions = queryClient.getDefaultOptions()
```

## `queryClient.setDefaultOptions`

The `setDefaultOptions` method can be used to dynamically set the default options for this queryClient. Previously defined default options will be overwritten.

```js
queryClient.setDefaultOptions({
  queries: {
    staleTime: Infinity,
  },
})
```

## `queryClient.getQueryDefaults`

The `getQueryDefaults` method returns the default options which have been set for specific queries:

```js
const defaultOptions = queryClient.getQueryDefaults('posts')
```

## `queryClient.setQueryDefaults`

`setQueryDefaults` can be used to set default options for specific queries:

```js
queryClient.setQueryDefaults('posts', { queryFn: fetchPosts })

function Component() {
  const { data } = useQuery('posts')
}
```

**Options**

- `queryKey: QueryKey`: [Query Keys](../guides/query-keys)
- `options: QueryOptions`

## `queryClient.getMutationDefaults`

The `getMutationDefaults` method returns the default options which have been set for specific mutations:

```js
const defaultOptions = queryClient.getMutationDefaults('addPost')
```

## `queryClient.setMutationDefaults`

`setMutationDefaults` can be used to set default options for specific mutations:

```js
queryClient.setMutationDefaults('addPost', { mutationFn: addPost })

function Component() {
  const { data } = useMutation('addPost')
}
```

**Options**

- `mutationKey: string | unknown[]`
- `options: MutationOptions`

## `queryClient.getQueryCache`

The `getQueryCache` method returns the query cache this client is connected to.

```js
const queryCache = queryClient.getQueryCache()
```

## `queryClient.getMutationCache`

The `getMutationCache` method returns the mutation cache this client is connected to.

```js
const mutationCache = queryClient.getMutationCache()
```

## `queryClient.clear`

The `clear` method clears all connected caches.

```js
queryClient.clear()
```
