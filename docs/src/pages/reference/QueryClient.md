---
id: QueryClient
title: QueryClient
---

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
- [`getQueryState`](#clientgetquerystate)
- [`setQueryDefaults`](#clientsetquerydefaults)
- [`refetchQueries`](#clientrefetchqueries)
- [`invalidateQueries`](#clientinvalidatequeries)
- [`cancelQueries`](#clientcancelqueries)
- [`removeQueries`](#clientremovequeries)
- [`watchQuery`](#clientwatchquery)
- [`watchQueries`](#clientwatchqueries)
- [`isFetching`](#queryclientisfetching)
- [`getDefaultOptions`](#clientsetdefaultoptions)
- [`setDefaultOptions`](#clientgetdefaultoptions)

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

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)

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

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)

## `client.setQueryDefaults`

`setQueryDefaults` is a synchronous method to set default options for a specific query. If the query does not exist yet it will create it.

```js
client.setQueryDefaults('posts', fetchPosts)

function Component() {
  const { data } = useQuery('posts')
}
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)

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

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)
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

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)
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

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)

**Returns**

This method does not return anything

## `client.removeQueries`

The `removeQueries` method can be used to remove queries from the cache based on their query keys or any other functionally accessible property/state of the query.

```js
client.removeQueries(queryKey, { exact: true })
```

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)

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

**Options**

- `queryKey?: QueryKey`: [Query Keys](../guides/query-keys)
- `filters?: QueryFilters`: [Query Filters](../guides/query-filters)

**Returns**

This method returns the number of fetching queries.

## `client.getDefaultOptions`

The `getDefaultOptions` method returns the default options which have been set when creating the client or with `setDefaultOptions`.

```js
const defaultOptions = client.getDefaultOptions()
```

## `client.setDefaultOptions`

The `setDefaultOptions` method can be used to dynamically set the default options for this client.

```js
client.setDefaultOptions({
  queries: {
    staleTime: Infinity,
  },
})
```
