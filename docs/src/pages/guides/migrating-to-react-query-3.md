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

**NOTE** There is no longer a default query cache, you must connect your application to a query provider manually

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

### Query function parameters

Query functions now get a `QueryFunctionContext` instead of the query key parameters.

The `QueryFunctionContext` contains a `queryKey` and a `pageParam` in case of infinite queries.

useQuery:

```js
// Old
useQuery(['post', id], (_key, id) => fetchPost(id))

// New
useQuery(['post', id], () => fetchPost(id))
```

useInfiniteQuery:

```js
// Old
useInfiniteQuery(['posts'], (_key, pageParam = 0) => fetchPosts(pageParam))

// New
useInfiniteQuery(['posts'], ({ pageParam = 0 }) => fetchPost(pageParam))
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
} = useInfiniteQuery(
  'projects',
  ({ pageParam = 0 }) => fetchProjects(pageParam),
  {
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  }
)
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
} = useInfiniteQuery(
  'projects',
  ({ pageParam = 0 }) => fetchProjects(pageParam),
  {
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    getPreviousPageParam: (firstPage, pages) => firstPage.prevCursor,
  }
)
```

One direction reversed:

```js
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery(
  'projects',
  ({ pageParam = 0 }) => fetchProjects(pageParam),
  {
    select: data => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  }
)
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

The `makeQueryCache()` function has been replaced by `new QueryCache()`.

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

### QueryOptions.queryFnParamsFilter

The `queryFnParamsFilter` option has been removed because query functions now get a `QueryFunctionContext` object instead of the query key.

Parameters can still be filtered within the query function itself as the `QueryFunctionContext` also contains the query key.

### QueryOptions.notifyOnStatusChange

The `notifyOnStatusChange` option has been replaced by the `notifyOnChangeProps` and `notifyOnChangePropsExclusions` props.

With these options it is possible to configure when a component should re-render on a granular level.

Only re-render when the `data` or `error` properties change:

```js
import { useQuery } from 'react-query'

function User() {
  const { data } = useQuery('user', fetchUser, {
    notifyOnChangeProps: ['data', 'error'],
  })
  return <div>Username: {data.username}</div>
}
```

Prevent re-render when the `isStale` property changes:

```js
import { useQuery } from 'react-query'

function User() {
  const { data } = useQuery('user', fetchUser, {
    notifyOnChangePropsExclusions: ['isStale'],
  })
  return <div>Username: {data.username}</div>
}
```

### QueryResult.clear()

The `QueryResult.clear()` method has been renamed to `QueryResult.remove()`.

### QueryResult.updatedAt

Because data and errors can be present at the same time, the `updatedAt` property has been split into `dataUpdatedAt` and `errorUpdatedAt`.

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

Set the `notifyOnChangeProps` option to `['data', 'error']` to only re-render when the selected data changes.

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

#### Persist mutations

Mutations can now be persisted to storage and resumed at a later point. More information can be found in the mutations documentation.

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

### Devtools are now part of the main repo and npm package

The devtools are now included in the `react-query` package itself under the import `react-query/devtools`. Simply replace `react-query-devtools` imports with `react-query/devtools`
