---
id: migrating-to-react-query-3
title: Migrating to React Query 3
---

## V3 migration

This article explains how to migrate your application to React Query 3.

### QueryClient

The `QueryCache` has been split into a `QueryClient` and a `QueryCache`.
The `QueryCache` contains all cached queries and the `QueryClient` can be used to interact with a cache.

This has some benefits:

- Allows for different type of caches.
- Multiple clients with different configurations can use the same cache.
- Clients can be used to track queries, which can be used for shared caches on SSR.
- The client API is more focused towards general usage.
- Easier to test the individual components.

Use the `QueryClientProvider` component to connect a `QueryClient` to your application:

```js
import { QueryClient, QueryClientProvider, QueryCache } from 'react-query'

const cache = new QueryCache()
const client = new QueryClient({ cache })

function App() {
  return <QueryClientProvider client={client}>...</QueryClientProvider>
}
```

### useQueryCache()

The `useQueryCache()` hook has been replaced by the `useQueryClient()` hook:

```js
import { useCallback } from 'react'
import { useQueryClient } from 'react-query'

function Todo() {
  const client = useQueryClient()

  const onClickButton = useCallback(() => {
    client.invalidateQueries('posts')
  }, [client])

  return <button onClick={onClickButton}>Refetch</button>
}
```

### ReactQueryConfigProvider

The `ReactQueryConfigProvider` component has been removed. Default options for queries and mutations can now be specified in `QueryClient`:

```js
const client = new QueryClient({
  cache,
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
})
```

### usePaginatedQuery()

The `usePaginatedQuery()` hook has been replaced by the `keepPreviousData` option on `useQuery`:

```js
import { useQuery } from 'react-query'

function Page({ page }) {
  const { data } = useQuery(['page', page], fetchPage, {
    keepPreviousData: true,
  })
}
```

### Query object syntax

The object syntax has been collapsed:

```js
// Old:
useQuery({
  queryKey: 'posts',
  queryFn: fetchPosts,
  config: { staleTime: Infinity },
})

// New:
useQuery({
  queryKey: 'posts',
  queryFn: fetchPosts,
  staleTime: Infinity,
})
```

### queryCache.prefetchQuery()

The `client.prefetchQuery()` method should now only be used for prefetching scenarios where the result is not relevant.

Use the `client.fetchQueryData()` method to get the query data or error:

```js
// Prefetch a query:
await client.prefetchQuery('posts', fetchPosts)

// Fetch a query:
try {
  const data = await client.fetchQueryData('posts', fetchPosts)
} catch (error) {
  // Error handling
}
```

### ReactQueryCacheProvider

The `ReactQueryCacheProvider` component has been replaced by the `QueryClientProvider` component.

### makeQueryCache()

The `makeQueryCache()` function has replaced by `new QueryCache()`.

### ReactQueryErrorResetBoundary

The `ReactQueryErrorResetBoundary` component has been renamed to `QueryErrorResetBoundary`.

### queryCache.resetErrorBoundaries()

The `queryCache.resetErrorBoundaries()` method has been replaced by the `QueryErrorResetBoundary` component.

### queryCache.getQuery()

The `queryCache.getQuery()` method has been replaced by `cache.find()`.

### queryCache.getQueries()

The `queryCache.getQueries()` method has been replaced by `cache.findAll()`.

### queryCache.isFetching

The `queryCache.isFetching` property has been replaced by `client.isFetching()`.

### QueryOptions.initialStale

The `initialStale` query option has been removed and initial data is now treated as regular data.
Which means that if `initialData` is provided, the query will refetch on mount by default.
If you do not want to refetch immediately, you can define a `staleTime`.

### QueryOptions.forceFetchOnMount

The `forceFetchOnMount` query option has been replaced by `refetchOnMount: 'always'`.

### QueryOptions.refetchOnMount

When `refetchOnMount` was set to `false` any additional components were prevented from refetching on mount.
In version 3 only the component where the option has been set will not refetch on mount.

### QueryResult.clear()

The `QueryResult.clear()` method has been renamed to `QueryResult.remove()`.

### New features

Some new features have also been added besides the API changes, performance improvements and file size reduction.

#### Selectors

The `useQuery` and `useInfiniteQuery` hooks now have a `select` option to select or transform parts of the query result.

```js
import { useQuery } from 'react-query'

function User() {
  const { data } = useQuery('user', fetchUser, {
    select: user => user.username,
  })
  return <div>Username: {data}</div>
}
```

Set the `notifyOnStatusChange` option to `false` to only re-render when the selected data changes.

#### useQueries()

The `useQueries()` hook can be used to fetch a variable number of queries:

```js
import { useQueries } from 'react-query'

function Overview() {
  const results = useQueries([
    { queryKey: ['post', 1], queryFn: fetchPost },
    { queryKey: ['post', 2], queryFn: fetchPost },
  ])
  return (
    <ul>
      {results.map(({ data }) => data && <li key={data.id}>{data.title})</li>)}
    </ul>
  )
}
```

#### client.watchQuery()

The `client.watchQuery()` method can be used to create and/or watch a query:

```js
const observer = client.watchQuery('posts')

observer.subscribe(result => {
  console.log(result)
  observer.unsubscribe()
})
```

#### client.watchQueries()

The `client.watchQueries()` method can be used to create and/or watch multiple queries:

```js
const observer = client.watchQueries([
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])

observer.subscribe(result => {
  console.log(result)
  observer.unsubscribe()
})
```

## `client.setQueryDefaults`

The `client.setQueryDefaults()` method to set default options for a specific query. If the query does not exist yet it will create it.

```js
client.setQueryDefaults('posts', fetchPosts)

function Component() {
  const { data } = useQuery('posts')
}
```

#### React Native error screens

To prevent showing error screens in React Native when a query fails it was necessary to manually change the Console:

```js
import { setConsole } from 'react-query'

setConsole({
  log: console.log,
  warn: console.warn,
  error: console.warn,
})
```

In version 3 this is done automatically when React Query is used in React Native.

#### Core separation

The core of React Query is now fully separated from React, which means it can also be used standalone or in other frameworks. Use the `react-query/core` entrypoint to only import the core functionality:

```js
import { QueryClient } from 'react-query/core'
```
