---
id: QueryClient
title: QueryClient
---

## `QueryClient`

The `QueryClient` can be used to interact with a cache:

```tsx
import { QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})

await queryClient.prefetchQuery({ queryKey: ['posts'], queryFn: fetchPosts })
```

Its available methods are:

- [`queryClient.fetchQuery`](#queryclientfetchquery)
- [`queryClient.fetchInfiniteQuery`](#queryclientfetchinfinitequery)
- [`queryClient.prefetchQuery`](#queryclientprefetchquery)
- [`queryClient.prefetchInfiniteQuery`](#queryclientprefetchinfinitequery)
- [`queryClient.getQueryData`](#queryclientgetquerydata)
- [`queryClient.ensureQueryData`](#queryclientensurequerydata)
- [`queryClient.ensureInfiniteQueryData`](#queryclientensureinfinitequerydata)
- [`queryClient.getQueriesData`](#queryclientgetqueriesdata)
- [`queryClient.setQueryData`](#queryclientsetquerydata)
- [`queryClient.getQueryState`](#queryclientgetquerystate)
- [`queryClient.setQueriesData`](#queryclientsetqueriesdata)
- [`queryClient.invalidateQueries`](#queryclientinvalidatequeries)
- [`queryClient.refetchQueries`](#queryclientrefetchqueries)
- [`queryClient.cancelQueries`](#queryclientcancelqueries)
- [`queryClient.removeQueries`](#queryclientremovequeries)
- [`queryClient.resetQueries`](#queryclientresetqueries)
- [`queryClient.isFetching`](#queryclientisfetching)
- [`queryClient.isMutating`](#queryclientismutating)
- [`queryClient.getDefaultOptions`](#queryclientgetdefaultoptions)
- [`queryClient.setDefaultOptions`](#queryclientsetdefaultoptions)
- [`queryClient.getQueryDefaults`](#queryclientgetquerydefaults)
- [`queryClient.setQueryDefaults`](#queryclientsetquerydefaults)
- [`queryClient.getMutationDefaults`](#queryclientgetmutationdefaults)
- [`queryClient.setMutationDefaults`](#queryclientsetmutationdefaults)
- [`queryClient.getQueryCache`](#queryclientgetquerycache)
- [`queryClient.getMutationCache`](#queryclientgetmutationcache)
- [`queryClient.clear`](#queryclientclear)
- [`queryClient.resumePausedMutations`](#queryclientresumepausedmutations)

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
  - You can also define defaults to be used for [hydration](../framework/react/reference/hydration.md)

## `queryClient.fetchQuery`

`fetchQuery` is an asynchronous method that can be used to fetch and cache a query. It will either resolve with the data or throw with the error. Use the `prefetchQuery` method if you just want to fetch a query without needing the result.

If the query exists and the data is not invalidated or older than the given `staleTime`, then the data from the cache will be returned. Otherwise it will try to fetch the latest data.

```tsx
try {
  const data = await queryClient.fetchQuery({ queryKey, queryFn })
} catch (error) {
  console.log(error)
}
```

Specify a `staleTime` to only fetch when the data is older than a certain amount of time:

```tsx
try {
  const data = await queryClient.fetchQuery({
    queryKey,
    queryFn,
    staleTime: 10000,
  })
} catch (error) {
  console.log(error)
}
```

**Options**

The options for `fetchQuery` are exactly the same as those of [`useQuery`](../framework/react/reference/useQuery.md), except the following: `enabled, refetchInterval, refetchIntervalInBackground, refetchOnWindowFocus, refetchOnReconnect, refetchOnMount, notifyOnChangeProps, throwOnError, select, suspense, placeholderData`; which are strictly for useQuery and useInfiniteQuery. You can check the [source code](https://github.com/TanStack/query/blob/7cd2d192e6da3df0b08e334ea1cf04cd70478827/packages/query-core/src/types.ts#L119) for more clarity.

**Returns**

- `Promise<TData>`

## `queryClient.fetchInfiniteQuery`

`fetchInfiniteQuery` is similar to `fetchQuery` but can be used to fetch and cache an infinite query.

```tsx
try {
  const data = await queryClient.fetchInfiniteQuery({ queryKey, queryFn })
  console.log(data.pages)
} catch (error) {
  console.log(error)
}
```

**Options**

The options for `fetchInfiniteQuery` are exactly the same as those of [`fetchQuery`](#queryclientfetchquery).

**Returns**

- `Promise<InfiniteData<TData, TPageParam>>`

## `queryClient.prefetchQuery`

`prefetchQuery` is an asynchronous method that can be used to prefetch a query before it is needed or rendered with `useQuery` and friends. The method works the same as `fetchQuery` except that it will not throw or return any data.

```tsx
await queryClient.prefetchQuery({ queryKey, queryFn })
```

You can even use it with a default queryFn in your config!

```tsx
await queryClient.prefetchQuery({ queryKey })
```

**Options**

The options for `prefetchQuery` are exactly the same as those of [`fetchQuery`](#queryclientfetchquery).

**Returns**

- `Promise<void>`
  - A promise is returned that will either immediately resolve if no fetch is needed or after the query has been executed. It will not return any data or throw any errors.

## `queryClient.prefetchInfiniteQuery`

`prefetchInfiniteQuery` is similar to `prefetchQuery` but can be used to prefetch and cache an infinite query.

```tsx
await queryClient.prefetchInfiniteQuery({ queryKey, queryFn })
```

**Options**

The options for `prefetchInfiniteQuery` are exactly the same as those of [`fetchQuery`](#queryclientfetchquery).

**Returns**

- `Promise<void>`
  - A promise is returned that will either immediately resolve if no fetch is needed or after the query has been executed. It will not return any data or throw any errors.

## `queryClient.getQueryData`

`getQueryData` is a synchronous function that can be used to get an existing query's cached data. If the query does not exist, `undefined` will be returned.

```tsx
const data = queryClient.getQueryData(queryKey)
```

**Options**

- `queryKey: QueryKey`: [Query Keys](../framework/react/guides/query-keys.md)

**Returns**

- `data: TQueryFnData | undefined`
  - The data for the cached query, or `undefined` if the query does not exist.

## `queryClient.ensureQueryData`

`ensureQueryData` is an asynchronous function that can be used to get an existing query's cached data. If the query does not exist, `queryClient.fetchQuery` will be called and its results returned.

```tsx
const data = await queryClient.ensureQueryData({ queryKey, queryFn })
```

**Options**

- the same options as [`fetchQuery`](#queryclientfetchquery)
- `revalidateIfStale: boolean`
  - Optional
  - Defaults to `false`
  - If set to `true`, stale data will be refetched in the background, but cached data will be returned immediately.

**Returns**

- `Promise<TData>`

## `queryClient.ensureInfiniteQueryData`

`ensureInfiniteQueryData` is an asynchronous function that can be used to get an existing infinite query's cached data. If the query does not exist, `queryClient.fetchInfiniteQuery` will be called and its results returned.

```tsx
const data = await queryClient.ensureInfiniteQueryData({
  queryKey,
  queryFn,
  initialPageParam,
  getNextPageParam,
})
```

**Options**

- the same options as [`fetchInfiniteQuery`](#queryclientfetchinfinitequery)
- `revalidateIfStale: boolean`
  - Optional
  - Defaults to `false`
  - If set to `true`, stale data will be refetched in the background, but cached data will be returned immediately.

**Returns**

- `Promise<InfiniteData<TData, TPageParam>>`

## `queryClient.getQueriesData`

`getQueriesData` is a synchronous function that can be used to get the cached data of multiple queries. Only queries that match the passed queryKey or queryFilter will be returned. If there are no matching queries, an empty array will be returned.

```tsx
const data = queryClient.getQueriesData(filters)
```

**Options**

- `filters: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)
  - if a filter is passed, the data with queryKeys matching the filter will be returned

**Returns**

- `[queryKey: QueryKey, data: TQueryFnData | undefined][]`
  - An array of tuples for the matched query keys, or `[]` if there are no matches. The tuples are the query key and its associated data.

**Caveats**

Because the returned data in each tuple can be of varying structures (i.e. using a filter to return "active" queries can return different data types), the `TData` generic defaults to `unknown`. If you provide a more specific type to `TData` it is assumed that you are certain each tuple's data entry is all the same type.

This distinction is more a "convenience" for ts devs that know which structure will be returned.

## `queryClient.setQueryData`

`setQueryData` is a synchronous function that can be used to immediately update a query's cached data. If the query does not exist, it will be created. **If the query is not utilized by a query hook in the default `gcTime` of 5 minutes, the query will be garbage collected**. To update multiple queries at once and match query keys partially, you need to use [`queryClient.setQueriesData`](#queryclientsetqueriesdata) instead.

> The difference between using `setQueryData` and `fetchQuery` is that `setQueryData` is sync and assumes that you already synchronously have the data available. If you need to fetch the data asynchronously, it's suggested that you either refetch the query key or use `fetchQuery` to handle the asynchronous fetch.

```tsx
queryClient.setQueryData(queryKey, updater)
```

**Options**

- `queryKey: QueryKey`: [Query Keys](../framework/react/guides/query-keys.md)
- `updater: TQueryFnData | undefined | ((oldData: TQueryFnData | undefined) => TQueryFnData | undefined)`
  - If non-function is passed, the data will be updated to this value
  - If a function is passed, it will receive the old data value and be expected to return a new one.

**Using an updater value**

```tsx
setQueryData(queryKey, newData)
```

If the value is `undefined`, the query data is not updated.

**Using an updater function**

For convenience in syntax, you can also pass an updater function which receives the current data value and returns the new one:

```tsx
setQueryData(queryKey, (oldData) => newData)
```

If the updater function returns `undefined`, the query data will not be updated. If the updater function receives `undefined` as input, you can return `undefined` to bail out of the update and thus _not_ create a new cache entry.

**Immutability**

Updates via `setQueryData` must be performed in an _immutable_ way. **DO NOT** attempt to write directly to the cache by mutating `oldData` or data that you retrieved via `getQueryData` in place.

## `queryClient.getQueryState`

`getQueryState` is a synchronous function that can be used to get an existing query's state. If the query does not exist, `undefined` will be returned.

```tsx
const state = queryClient.getQueryState(queryKey)
console.log(state.dataUpdatedAt)
```

**Options**

- `queryKey: QueryKey`: [Query Keys](../framework/react/guides/query-keys.md)

## `queryClient.setQueriesData`

`setQueriesData` is a synchronous function that can be used to immediately update cached data of multiple queries by using filter function or partially matching the query key. Only queries that match the passed queryKey or queryFilter will be updated - no new cache entries will be created. Under the hood, [`setQueryData`](#queryclientsetquerydata) is called for each existing query.

```tsx
queryClient.setQueriesData(filters, updater)
```

**Options**

- `filters: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)
  - if a filter is passed, queryKeys matching the filter will be updated
- `updater: TQueryFnData | (oldData: TQueryFnData | undefined) => TQueryFnData`
  - the [setQueryData](#queryclientsetquerydata) updater function or new data, will be called for each matching queryKey

## `queryClient.invalidateQueries`

The `invalidateQueries` method can be used to invalidate and refetch single or multiple queries in the cache based on their query keys or any other functionally accessible property/state of the query. By default, all matching queries are immediately marked as invalid and active queries are refetched in the background.

- If you **do not want active queries to refetch**, and simply be marked as invalid, you can use the `refetchType: 'none'` option.
- If you **want inactive queries to refetch** as well, use the `refetchType: 'all'` option
- For refetching, [queryClient.refetchQueries](#queryclientrefetchqueries) is called.

```tsx
await queryClient.invalidateQueries(
  {
    queryKey: ['posts'],
    exact,
    refetchType: 'active',
  },
  { throwOnError, cancelRefetch },
)
```

**Options**

- `filters?: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)
  - `queryKey?: QueryKey`: [Query Keys](../framework/react/guides/query-keys.md)
  - `refetchType?: 'active' | 'inactive' | 'all' | 'none'`
    - Defaults to `'active'`
    - When set to `active`, only queries that match the refetch predicate and are actively being rendered via `useQuery` and friends will be refetched in the background.
    - When set to `inactive`, only queries that match the refetch predicate and are NOT actively being rendered via `useQuery` and friends will be refetched in the background.
    - When set to `all`, all queries that match the refetch predicate will be refetched in the background.
    - When set to `none`, no queries will be refetched, and those that match the refetch predicate will be marked as invalid only.
- `options?: InvalidateOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.
  - `cancelRefetch?: boolean`
    - Defaults to `true`
      - Per default, a currently running request will be cancelled before a new request is made
    - When set to `false`, no refetch will be made if there is already a request running.

## `queryClient.refetchQueries`

The `refetchQueries` method can be used to refetch queries based on certain conditions.

Examples:

```tsx
// refetch all queries:
await queryClient.refetchQueries()

// refetch all stale queries:
await queryClient.refetchQueries({ stale: true })

// refetch all active queries partially matching a query key:
await queryClient.refetchQueries({ queryKey: ['posts'], type: 'active' })

// refetch all active queries exactly matching a query key:
await queryClient.refetchQueries({
  queryKey: ['posts', 1],
  type: 'active',
  exact: true,
})
```

**Options**

- `filters?: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)
- `options?: RefetchOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.
  - `cancelRefetch?: boolean`
    - Defaults to `true`
      - Per default, a currently running request will be cancelled before a new request is made
    - When set to `false`, no refetch will be made if there is already a request running.

**Returns**

This function returns a promise that will resolve when all of the queries are done being refetched. By default, it **will not** throw an error if any of those queries refetches fail, but this can be configured by setting the `throwOnError` option to `true`

**Notes**

- Queries that are "disabled" because they only have disabled Observers will never be refetched.
- Queries that are "static" because they only have Observers with a Static StaleTime will never be refetched.

## `queryClient.cancelQueries`

The `cancelQueries` method can be used to cancel outgoing queries based on their query keys or any other functionally accessible property/state of the query.

This is most useful when performing optimistic updates since you will likely need to cancel any outgoing query refetches so they don't clobber your optimistic update when they resolve.

```tsx
await queryClient.cancelQueries(
  { queryKey: ['posts'], exact: true },
  { silent: true },
)
```

**Options**

- `filters?: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)
- `cancelOptions?: CancelOptions`: [Cancel Options](../framework/react/guides/query-cancellation.md#cancel-options)

**Returns**

This method does not return anything

## `queryClient.removeQueries`

The `removeQueries` method can be used to remove queries from the cache based on their query keys or any other functionally accessible property/state of the query.

```tsx
queryClient.removeQueries({ queryKey, exact: true })
```

**Options**

- `filters?: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)

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

```tsx
queryClient.resetQueries({ queryKey, exact: true })
```

**Options**

- `filters?: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)
- `options?: ResetOptions`:
  - `throwOnError?: boolean`
    - When set to `true`, this method will throw if any of the query refetch tasks fail.
  - `cancelRefetch?: boolean`
    - Defaults to `true`
      - Per default, a currently running request will be cancelled before a new request is made
    - When set to `false`, no refetch will be made if there is already a request running.

**Returns**

This method returns a promise that resolves when all active queries have been refetched.

## `queryClient.isFetching`

This `isFetching` method returns an `integer` representing how many queries, if any, in the cache are currently fetching (including background-fetching, loading new pages, or loading more infinite query results)

```tsx
if (queryClient.isFetching()) {
  console.log('At least one query is fetching!')
}
```

TanStack Query also exports a handy [`useIsFetching`](../framework/react/reference/useIsFetching.md) hook that will let you subscribe to this state in your components without creating a manual subscription to the query cache.

**Options**

- `filters?: QueryFilters`: [Query Filters](../framework/react/guides/filters.md#query-filters)

**Returns**

This method returns the number of fetching queries.

## `queryClient.isMutating`

This `isMutating` method returns an `integer` representing how many mutations, if any, in the cache are currently fetching.

```tsx
if (queryClient.isMutating()) {
  console.log('At least one mutation is fetching!')
}
```

TanStack Query also exports a handy [`useIsMutating`](../framework/react/reference/useIsMutating.md) hook that will let you subscribe to this state in your components without creating a manual subscription to the mutation cache.

**Options**

- `filters: MutationFilters`: [Mutation Filters](../framework/react/guides/filters.md#mutation-filters)

**Returns**

This method returns the number of fetching mutations.

## `queryClient.getDefaultOptions`

The `getDefaultOptions` method returns the default options which have been set when creating the client or with `setDefaultOptions`.

```tsx
const defaultOptions = queryClient.getDefaultOptions()
```

## `queryClient.setDefaultOptions`

The `setDefaultOptions` method can be used to dynamically set the default options for this queryClient. Previously defined default options will be overwritten.

```tsx
queryClient.setDefaultOptions({
  queries: {
    staleTime: Infinity,
  },
})
```

## `queryClient.getQueryDefaults`

The `getQueryDefaults` method returns the default options which have been set for specific queries:

```tsx
const defaultOptions = queryClient.getQueryDefaults(['posts'])
```

> Note that if several query defaults match the given query key, they will be merged together based on the order of registration.
> See [`setQueryDefaults`](#queryclientsetquerydefaults).

## `queryClient.setQueryDefaults`

`setQueryDefaults` can be used to set default options for specific queries:

```tsx
queryClient.setQueryDefaults(['posts'], { queryFn: fetchPosts })

function Component() {
  const { data } = useQuery({ queryKey: ['posts'] })
}
```

**Options**

- `queryKey: QueryKey`: [Query Keys](../framework/react/guides/query-keys.md)
- `options: QueryOptions`

> As stated in [`getQueryDefaults`](#queryclientgetquerydefaults), the order of registration of query defaults does matter.
> Since the matching defaults are merged by `getQueryDefaults`, the registration should be made in the following order: from the **most generic key** to the **least generic one** .
> This way, more specific defaults will override more generic defaults.

## `queryClient.getMutationDefaults`

The `getMutationDefaults` method returns the default options which have been set for specific mutations:

```tsx
const defaultOptions = queryClient.getMutationDefaults(['addPost'])
```

## `queryClient.setMutationDefaults`

`setMutationDefaults` can be used to set default options for specific mutations:

```tsx
queryClient.setMutationDefaults(['addPost'], { mutationFn: addPost })

function Component() {
  const { data } = useMutation({ mutationKey: ['addPost'] })
}
```

**Options**

- `mutationKey: unknown[]`
- `options: MutationOptions`

> Similar to [`setQueryDefaults`](#queryclientsetquerydefaults), the order of registration does matter here.

## `queryClient.getQueryCache`

The `getQueryCache` method returns the query cache this client is connected to.

```tsx
const queryCache = queryClient.getQueryCache()
```

## `queryClient.getMutationCache`

The `getMutationCache` method returns the mutation cache this client is connected to.

```tsx
const mutationCache = queryClient.getMutationCache()
```

## `queryClient.clear`

The `clear` method clears all connected caches.

```tsx
queryClient.clear()
```

## `queryClient.resumePausedMutations`

Can be used to resume mutations that have been paused because there was no network connection.

```tsx
queryClient.resumePausedMutations()
```
