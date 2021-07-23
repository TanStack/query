---
id: migrating-to-react-query-3
title: Migrating to React Query 3
---

Previous versions of React Query were awesome and brought some amazing new features, more magic, and an overall better experience to the library. They also brought on massive adoption and likewise a lot of refining fire (issues/contributions) to the library and brought to light a few things that needed more polish to make the library even better. v3 contains that very polish.

## Overview

- More scalable and testable cache configuration
- Better SSR support
- Data-lag (previously usePaginatedQuery) anywhere!
- Bi-directional Infinite Queries
- Query data selectors!
- Fully configure defaults for queries and/or mutations before use
- More granularity for optional rendering optimization
- New `useQueries` hook! (Variable-length parallel query execution)
- Query filter support for the `useIsFetching()` hook!
- Retry/offline/replay support for mutations
- Observe queries/mutations outside of React
- Use the React Query core logic anywhere you want!
- Bundled/Colocated Devtools via `react-query/devtools`
- Cache Persistence to web storage (experimental via `react-query/persistQueryClient-experimental` and `react-query/createWebStoragePersistor-experimental`)

## Breaking Changes

### The `QueryCache` has been split into a `QueryClient` and lower-level `QueryCache` and `MutationCache` instances.

The `QueryCache` contains all queries, the `MutationCache` contains all mutations, and the `QueryClient` can be used to set configuration and to interact with them.

This has some benefits:

- Allows for different types of caches.
- Multiple clients with different configurations can use the same cache.
- Clients can be used to track queries, which can be used for shared caches on SSR.
- The client API is more focused towards general usage.
- Easier to test the individual components.

When creating a `new QueryClient()`, a `QueryCache` and `MutationCache` are automatically created for you if you don't supply them.

```js
import { QueryClient } from 'react-query'

const queryClient = new QueryClient()
```

### `ReactQueryConfigProvider` and `ReactQueryCacheProvider` have both been replaced by `QueryClientProvider`

Default options for queries and mutations can now be specified in `QueryClient`:

**Notice that it's now defaultOptions instead of defaultConfig**

```js
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // query options
    },
    mutations: {
      // mutation options
    },
  },
})
```

The `QueryClientProvider` component is now used to connect a `QueryClient` to your application:

```js
import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

### The default `QueryCache` is gone. **For real this time!**

As previously noted with a deprecation, there is no longer a default `QueryCache` that is created or exported from the main package. **You must create your own via `new QueryClient()` or `new QueryCache()` (which you can then pass to `new QueryClient({ queryCache })` )**

### The deprecated `makeQueryCache` utility has been removed.

It's been a long time coming, but it's finally gone :)

### `QueryCache.prefetchQuery()` has been moved to `QueryClient.prefetchQuery()`

The new `QueryClient.prefetchQuery()` function is async, but **does not return the data from the query**. If you require the data, use the new `QueryClient.fetchQuery()` function

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

### `ReactQueryErrorResetBoundary` and `QueryCache.resetErrorBoundaries()` have been replaced by `QueryErrorResetBoundary` and `useQueryErrorResetBoundary()`.

Together, these provide the same experience as before, but with added control to choose which component trees you want to reset. For more information, see:

- [QueryErrorResetBoundary](../reference/QueryErrorResetBoundary)
- [useQueryErrorResetBoundary](../reference/useQueryErrorResetBoundary)

### `QueryCache.getQuery()` has been replaced by `QueryCache.find()`.

`QueryCache.find()` should now be used to look up individual queries from a cache

### `QueryCache.getQueries()` has been moved to `QueryCache.findAll()`.

`QueryCache.findAll()` should now be used to look up multiple queries from a cache

### `QueryCache.isFetching` has been moved to `QueryClient.isFetching()`.

**Notice that it's now a function instead of a property**

### The `useQueryCache` hook has been replaced by the `useQueryClient` hook.

It returns the provided `queryClient` for its component tree and shouldn't need much tweaking beyond a rename.

### Query key parts/pieces are no longer automatically spread to the query function.

Inline functions are now the suggested way of passing parameters to your query functions:

```js
// Old
useQuery(['post', id], (_key, id) => fetchPost(id))

// New
useQuery(['post', id], () => fetchPost(id))
```

If you still insist on not using inline functions, you can use the newly passed `QueryFunctionContext`:

```js
useQuery(['post', id], context => fetchPost(context.queryKey[1]))
```

### Infinite Query Page params are now passed via `QueryFunctionContext.pageParam`

They were previously added as the last query key parameter in your query function, but this proved to be difficult for some patterns

```js
// Old
useInfiniteQuery(['posts'], (_key, pageParam = 0) => fetchPosts(pageParam))

// New
useInfiniteQuery(['posts'], ({ pageParam = 0 }) => fetchPosts(pageParam))
```

### usePaginatedQuery() has been deprecated in favor of the `keepPreviousData` option

The new `keepPreviousData` options is available for both `useQuery` and `useInfiniteQuery` and will have the same "lagging" effect on your data:

```js
import { useQuery } from 'react-query'

function Page({ page }) {
  const { data } = useQuery(['page', page], fetchPage, {
    keepPreviousData: true,
  })
}
```

### useInfiniteQuery() is now bi-directional

The `useInfiniteQuery()` interface has changed to fully support bi-directional infinite lists.

- `options.getFetchMore` has been renamed to `options.getNextPageParam`
- `queryResult.canFetchMore` has been renamed to `queryResult.hasNextPage`
- `queryResult.fetchMore` has been renamed to `queryResult.fetchNextPage`
- `queryResult.isFetchingMore` has been renamed to `queryResult.isFetchingNextPage`
- Added the `options.getPreviousPageParam` option
- Added the `queryResult.hasPreviousPage` property
- Added the `queryResult.fetchPreviousPage` property
- Added the `queryResult.isFetchingPreviousPage`
- The `data` of an infinite query is now an object containing the `pages` and the `pageParams` used to fetch the pages: `{ pages: [data, data, data], pageParams: [...]}`

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

### Infinite Query data now contains the array of pages and pageParams used to fetch those pages.

This allows for easier manipulation of the data and the page params, like, for example, removing the first page of data along with it's params:

```js
queryClient.setQueryData('projects', data => ({
  pages: data.pages.slice(1),
  pageParams: data.pageParams.slice(1),
}))
```

### useMutation now returns an object instead of an array

Though the old way gave us warm fuzzy feelings of when we first discovered `useState` for the first time, they didn't last long. Now the mutation return is a single object.

```js
// Old:
const [mutate, { status, reset }] = useMutation()

// New:
const { mutate, status, reset } = useMutation()
```

### `mutation.mutate` no longer return a promise

- The `[mutate]` variable has been changed to the `mutation.mutate` function
- Added the `mutation.mutateAsync` function

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
    console.log('settled')
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
  console.log('settled')
}
```

### The object syntax for useQuery now uses a collapsed config:

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

### If set, the QueryOptions.enabled option must be a boolean (`true`/`false`)

The `enabled` query option will now only disable a query when the value is `false`.
If needed, values can be casted with `!!userId` or `Boolean(userId)` and a handy error will be thrown if a non-boolean value is passed.

### The QueryOptions.initialStale option has been removed

The `initialStale` query option has been removed and initial data is now treated as regular data.
Which means that if `initialData` is provided, the query will refetch on mount by default.
If you do not want to refetch immediately, you can define a `staleTime`.

### The `QueryOptions.forceFetchOnMount` option has been replaced by `refetchOnMount: 'always'`

Honestly, we were acruing way too many `refetchOn____` options, so this should clean things up.

### The `QueryOptions.refetchOnMount` options now only applies to its parent component instead of all query observers

When `refetchOnMount` was set to `false` any additional components were prevented from refetching on mount.
In version 3 only the component where the option has been set will not refetch on mount.

### The `QueryOptions.queryFnParamsFilter` has been removed in favor of the new `QueryFunctionContext` object.

The `queryFnParamsFilter` option has been removed because query functions now get a `QueryFunctionContext` object instead of the query key.

Parameters can still be filtered within the query function itself as the `QueryFunctionContext` also contains the query key.

### The `QueryOptions.notifyOnStatusChange` option has been superceded by the new `notifyOnChangeProps` and `notifyOnChangePropsExclusions` options.

With these new options it is possible to configure when a component should re-render on a granular level.

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

### The `QueryResult.clear()` function has been renamed to `QueryResult.remove()`

Although it was called `clear`, it really just removed the query from the cache. The name now matches the functionality.

### The `QueryResult.updatedAt` property has been split into `QueryResult.dataUpdatedAt` and `QueryResult.errorUpdatedAt` properties

Because data and errors can be present at the same time, the `updatedAt` property has been split into `dataUpdatedAt` and `errorUpdatedAt`.

### `setConsole()` has been replaced by the new `setLogger()` function

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

### React Native no longer requires overriding the logger

To prevent showing error screens in React Native when a query fails it was necessary to manually change the Console:

```js
import { setConsole } from 'react-query'

setConsole({
  log: console.log,
  warn: console.warn,
  error: console.warn,
})
```

In version 3 **this is done automatically when React Query is used in React Native**.


### Typescript
#### `QueryStatus` has been changed from an [enum](https://www.typescriptlang.org/docs/handbook/enums.html#string-enums) to a [union type](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

So, if you were checking the status property of a query or mutation against a QueryStatus enum property you will have to check it now against the string literal the enum previously held for each property.

Therefore you have to change the enum properties to their equivalent string literal, like this:
- `QueryStatus.Idle` -> `'idle'`
- `QueryStatus.Loading` -> `'loading'`
- `QueryStatus.Error` -> `'error'`
- `QueryStatus.Success` -> `'success'`

Here is an example of the changes you would have to make:

```diff
- import { useQuery, QueryStatus } from 'react-query';
+ import { useQuery } from 'react-query';

const { data, status } = useQuery(['post', id], () => fetchPost(id))

- if (status === QueryStatus.Loading) {
+ if (status === 'loading') {
  ...
}

- if (status === QueryStatus.Error) {
+ if (status === 'error') {
  ...
}
```

## New features

#### Query Data Selectors

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

#### The useQueries() hook, for variable-length parallel query execution

Wish you could run `useQuery` in a loop? The rules of hooks say no, but with the new `useQueries()` hook, you can!

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

The `QueryClient.setQueryDefaults()` method can be used to set default options for specific queries:

```js
queryClient.setQueryDefaults('posts', { queryFn: fetchPosts })

function Component() {
  const { data } = useQuery('posts')
}
```

#### Set default options for specific mutations

The `QueryClient.setMutationDefaults()` method can be used to set default options for specific mutations:

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
