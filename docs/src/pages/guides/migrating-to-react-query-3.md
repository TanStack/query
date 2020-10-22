---
id: migrating-to-react-query-3
title: Migrating to React Query 3
---

## V3 migration

This article explains how to migrate your application to React Query 3.

### QueryClient

The `QueryCache` has been split into a `QueryClient`, `QueryCache` and `MutationCache`.
The `QueryCache` contains all queries, the `MutationCache` contains all mutations, and the `QueryClient` can be used to set configuration and to interact with them.

This has some benefits:

- Allows for different type of caches.
- Multiple clients with different configurations can use the same cache.
- Clients can be used to track queries, which can be used for shared caches on SSR.
- The client API is more focused towards general usage.
- Easier to test the individual components.

Use the `QueryClientProvider` component to connect a `QueryClient` to your application:

```js
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

### useQueryCache()

The `useQueryCache()` hook has been replaced by the `useQueryClient()` hook:

```js
import { useCallback } from 'react'
import { useQueryClient } from 'react-query'

function Todo() {
  const queryClient = useQueryClient()

  const onClickButton = useCallback(() => {
    queryClient.invalidateQueries('posts')
  }, [queryClient])

  return <button onClick={onClickButton}>Refetch</button>
}
```

### ReactQueryConfigProvider

The `ReactQueryConfigProvider` component has been removed. Default options for queries and mutations can now be specified in `QueryClient`:

```js
const queryClient = new QueryClient({
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

### useInfiniteQuery()

The `useInfiniteQuery()` interface has changed to fully support bi-directional infinite lists and manual updates.

The `data` of an infinite query is now an object containing the `pages` and the `pageParams` used to fetch the pages.

One direction:

```js
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery('projects', fetchProjects, {
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
})
```

Both directions:

```js
const {
  data,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
} = useInfiniteQuery('projects', fetchProjects, {
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
})
```

One direction reversed:

```js
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery('projects', fetchProjects, {
  select: data => ({
    pages: [...data.pages].reverse(),
    pageParams: [...data.pageParams].reverse(),
  }),
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
})
```

Manually removing the first page:

```js
queryClient.setQueryData('projects', data => ({
  pages: data.pages.slice(1),
  pageParams: data.pageParams.slice(1),
}))
```

### useMutation()

The `useMutation()` hook now returns an object instead of an array:

```js
// Old:
const [mutate, { status, reset }] = useMutation()

// New:
const { mutate, status, reset } = useMutation()
```

Previously the `mutate` function returned a promise which resolved to `undefined` if a mutation failed instead of throwing.
We got a lot of questions regarding this behavior as users expected the promise to behave like a regular promise.
Because of this the `mutate` function is now split into a `mutate` and `mutateAsync` function.

The `mutate` function can be used when using callbacks:

```js
const { mutate } = useMutation(addTodo)

mutate('todo', {
  onSuccess: data => {
    console.log(data)
  },
  onError: error => {
    console.error(error)
  },
  onSettled: () => {
    console.log('settled)
  },
})
```

The `mutateAsync` function can be used when using async/await:

```js
const { mutateAsync } = useMutation(addTodo)

try {
  const data = await mutateAsync('todo')
  console.log(data)
} catch (error) {
  console.error(error)
} finally {
  console.log('settled)
}
```

Callbacks passed to the `mutate` or `mutateAsync` functions will now override the callbacks defined on `useMutation`.
The `mutateAsync` function can be used to compose side effects.

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

The `queryClient.prefetchQuery()` method should now only be used for prefetching scenarios where the result is not relevant.

Use the `queryClient.fetchQuery()` method to get the query data or error:

```js
// Prefetch a query:
await queryClient.prefetchQuery('posts', fetchPosts)

// Fetch a query:
try {
  const data = await queryClient.fetchQuery('posts', fetchPosts)
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

The `queryCache.getQuery()` method has been replaced by `queryCache.find()`.

### queryCache.getQueries()

The `queryCache.getQueries()` method has been replaced by `queryCache.findAll()`.

### queryCache.isFetching

The `queryCache.isFetching` property has been replaced by `queryClient.isFetching()`.

### QueryOptions.enabled

The `enabled` query option will now only disable a query when the value is `false`.
If needed, values can be casted with `!!userId` or `Boolean(userId)`.

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

### setConsole

The `setConsole` function has been replaced by `setLogger`:

```js
import { setLogger } from 'react-query'

// Log with Sentry
setLogger({
  error: error => {
    Sentry.captureException(error)
  },
})

// Log with Winston
setLogger(winston.createLogger())
```

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

#### Retry/offline mutations

By default React Query will not retry a mutation on error, but it is possible with the `retry` option:

```js
const mutation = useMutation(addTodo, {
  retry: 3,
})
```

If mutations fail because the device is offline, they will be retried in the same order when the device reconnects.

#### QueryObserver

A `QueryObserver` can be used to create and/or watch a query:

```js
const observer = new QueryObserver(queryClient, { queryKey: 'posts' })

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

#### InfiniteQueryObserver

A `InfiniteQueryObserver` can be used to create and/or watch an infinite query:

```js
const observer = new InfiniteQueryObserver(queryClient, {
  queryKey: 'posts',
  queryFn: fetchPosts,
  getNextPageParam: (lastPage, allPages) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage, allPages) => firstPage.prevCursor,
})

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

#### QueriesObserver

A `QueriesObserver` can be used to create and/or watch multiple queries:

```js
const observer = new QueriesObserver(queryClient, [
  { queryKey: ['post', 1], queryFn: fetchPost },
  { queryKey: ['post', 2], queryFn: fetchPost },
])

const unsubscribe = observer.subscribe(result => {
  console.log(result)
  unsubscribe()
})
```

#### Set default options for specific queries

The `queryClient.setQueryDefaults()` method can be used to set default options for specific queries:

```js
queryClient.setQueryDefaults('posts', { queryFn: fetchPosts })

function Component() {
  const { data } = useQuery('posts')
}
```

#### Set default options for specific mutations

The `queryClient.setMutationDefaults()` method can be used to set default options for specific mutations:

```js
queryClient.setMutationDefaults('addPost', { mutationFn: addPost })

function Component() {
  const { mutate } = useMutation('addPost')
}
```

#### useIsFetching()

The `useIsFetching()` hook now accepts filters which can be used to for example only show a spinner for certain type of queries:

```js
const fetches = useIsFetching(['posts'])
```

#### Core separation

The core of React Query is now fully separated from React, which means it can also be used standalone or in other frameworks. Use the `react-query/core` entrypoint to only import the core functionality:

```js
import { QueryClient } from 'react-query/core'
```
