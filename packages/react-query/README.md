<img src="https://static.scarf.sh/a.png?x-pxid=be2d8a11-9712-4c1d-9963-580b2d4fb133" />

<picture>
  <source
    media="(prefers-color-scheme: dark)"
    srcset="https://tanstack.com/api/readme/query.png?framework=react&theme=dark"
  />
  <source
    media="(prefers-color-scheme: light)"
    srcset="https://tanstack.com/api/readme/query.png?framework=react"
  />
  <img
    src="https://tanstack.com/api/readme/query.png?framework=react"
    alt="TanStack React Query"
    width="900"
  />
</picture>

Hooks for fetching, caching and updating asynchronous data in React

<a href="https://twitter.com/intent/tweet?button_hashtag=TanStack" target="\_parent">
  <img alt="#TanStack" src="https://img.shields.io/twitter/url?color=%2308a0e9&label=%23TanStack&style=social&url=https%3A%2F%2Ftwitter.com%2Fintent%2Ftweet%3Fbutton_hashtag%3DTanStack">
</a><a href="https://discord.com/invite/WrRKjPJ" target="\_parent">
  <img alt="" src="https://img.shields.io/badge/Discord-TanStack-%235865F2" />
</a><a href="https://github.com/TanStack/query/actions/workflows/release.yml?query=branch%3Amain">
<img alt="Release status" src="https://github.com/TanStack/query/actions/workflows/release.yml/badge.svg?branch=main" />
</a><a href="https://www.npmjs.com/package/@tanstack/query-core" target="\_parent">
  <img alt="" src="https://img.shields.io/npm/dm/@tanstack/query-core.svg" />
</a><a href="https://bundlejs.com/?q=%40tanstack%2Freact-query&config=%7B%22esbuild%22%3A%7B%22external%22%3A%5B%22react%22%2C%22react-dom%22%5D%7D%7D&badge=" target="\_parent">
  <img alt="" src="https://deno.bundlejs.com/?q=@tanstack/react-query&config={%22esbuild%22:{%22external%22:[%22react%22,%22react-dom%22]}}&badge=detailed" />
</a><a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a><a href="https://github.com/TanStack/query/discussions">
  <img alt="Join the discussion on Github" src="https://img.shields.io/badge/Github%20Discussions%20%26%20Support-Chat%20now!-blue" />
</a><a href="https://bestofjs.org/projects/tanstack-query"><img alt="Best of JS" src="https://img.shields.io/endpoint?url=https://bestofjs-serverless.now.sh/api/project-badge?fullName=TanStack%2Fquery%26since=daily" /></a><a href="https://github.com/TanStack/query/" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/TanStack/query.svg?style=social&label=Star" />
</a><a href="https://twitter.com/tannerlinsley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/tannerlinsley.svg?style=social&label=Follow" />
</a> <a href="https://gitpod.io/from-referrer/">
  <img src="https://img.shields.io/badge/Gitpod-Ready--to--Code-blue?logo=gitpod" alt="Gitpod Ready-to-Code"/>
</a>

Enjoy this library? Try the entire [TanStack](https://tanstack.com)! [TanStack Table](https://github.com/TanStack/table), [TanStack Router](https://github.com/tanstack/router), [TanStack Virtual](https://github.com/tanstack/virtual), [React Charts](https://github.com/TanStack/react-charts), [React Ranger](https://github.com/TanStack/ranger)

## Visit [tanstack.com/query](https://tanstack.com/query) for docs, guides, API and more!

## Quick Features

- Transport/protocol/backend agnostic data fetching (REST, GraphQL, promises, whatever!)
- Auto Caching + Refetching (stale-while-revalidate, Window Refocus, Polling/Realtime)
- Parallel + Dependent Queries
- Mutations + Reactive Query Refetching
- Multi-layer Cache + Automatic Garbage Collection
- Paginated + Cursor-based Queries
- Load-More + Infinite Scroll Queries w/ Scroll Recovery
- Request Cancellation
- [React Suspense](https://react.dev/reference/react/Suspense) + Fetch-As-You-Render Query Prefetching
- Dedicated Devtools

### [Become a Sponsor!](https://github.com/sponsors/tannerlinsley/)

<!-- Use the force, Luke -->

## Using React Query

React Query offers a treeshakable ESM API for React 19. A `QueryClient` holds cache state and configuration. Import client operations and optional query features where you use them.

The React adapter depends on `@tanstack/query-core`, which owns the cache, observers, client operations and optional features. The React entry re-exports that core. Direct core callers and React components can use the same client, cache and managers.

```tsx
import {
  QueryClient,
  QueryClientProvider,
  refetchInterval,
  queryOptions,
  useQuery,
} from '@tanstack/react-query'

const client = new QueryClient()

function Orders() {
  const { data } = useQuery(
    queryOptions({
      queryKey: ['orders'],
      queryFn: fetchOrders,
      refetchInterval: refetchInterval(3000),
    }),
  )
  return <p>{data?.length} orders</p>
}

export function App() {
  return (
    <QueryClientProvider client={client}>
      <Orders />
    </QueryClientProvider>
  )
}
```

All four single-query option factories accept the same interval helper. Query defaults also accept it. Pass a callback to compute the next interval from the cached query. Return `false` or `undefined` to stop polling.

```ts
useQuery(
  queryOptions({
    queryKey: ['job', jobId],
    queryFn: () => fetchJob(jobId),
    refetchInterval: (query) =>
      query.state.data?.status === 'complete' ? false : refetchInterval(3000),
  }),
)
```

Polling runs while an enabled observer has subscribers and the window is focused. Set `refetchIntervalInBackground: true` to keep polling in the background. Each observer manages its own timer, including when several observers share a client default.

## Choosing how a query renders

Choose an option factory for the data you read and the loading behavior you want. Pass its result to `useQuery`. Each factory attaches the observer and tags the key with the cached data and error types. Ordinary and Suspense readers can use the same client and cache key.

You can spread a descriptor to override options at a hook call. In a library that emits TypeScript declarations, export the factory call, or annotate an exported copy with `typeof originalDescriptor`. That gives the declaration emitter a name for its tagged key and observer type.

| Reader                                        | Ordinary query                            | Paginated query                                   |
| --------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Component handles pending state               | `useQuery(queryOptions(options))`         | `useQuery(infiniteQueryOptions(options))`         |
| React Suspense boundary handles pending state | `useQuery(suspenseQueryOptions(options))` | `useQuery(suspenseInfiniteQueryOptions(options))` |

```tsx
import {
  isPending,
  queryOptions,
  suspenseQueryOptions,
  useQuery,
} from '@tanstack/react-query'

const postQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

const postSuspenseQueryOptions = (id: number) =>
  suspenseQueryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
  })

function PostPreview({ id }: { id: number }) {
  const post = useQuery(postQueryOptions(id))
  return <p>{isPending(post) ? 'Loading…' : post.data?.title}</p>
}

// Render inside <Suspense fallback={<p>Loading…</p>}>.
function PostTitle({ id }: { id: number }) {
  const post = useQuery(postSuspenseQueryOptions(id))
  return <h1>{post.data.title}</h1>
}
```

The Suspense policy sends a failed query without cached data to the nearest error boundary.
Suspense factories own `enabled` and `throwOnError`. Pass `skipToken` as the fetcher for a conditional Suspense query. A skipped query renders with cached data or `undefined`.

Ordinary single and paginated queries return failures in `result.error` by default. To send a failure to a React error boundary, import `throwOnError` and pass it in the descriptor or the client's query defaults. Use `[throwOnError, true]` for every error, or put a predicate in the second slot. For example, this reader keeps displaying a cached post when a background refresh fails.

```ts
import { queryOptions, throwOnError } from '@tanstack/react-query'

const postQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    throwOnError: [
      throwOnError,
      (_error, query) => query.state.data === undefined,
    ],
  })
```

Set `throwOnError: false` on a query to override a client or key default. Use `QueryErrorResetBoundary` to allow a failed boundary reader to retry. An ordinary reader that handles errors inline leaves a pending boundary reset available for its siblings.

### Reading query state

Read `status` (`pending`, `error`, or `success`) and `fetchStatus` (`idle`, `fetching`, or `paused`) directly, or import the predicates your component uses. The predicates work on single, infinite, and parallel query results. TypeScript narrows the result along with its `data` and `error`. For example, a failed background refetch can retain data. A loading error has no data.

```tsx
import {
  isLoadingError,
  isPending,
  queryOptions,
  useQuery,
} from '@tanstack/react-query'

const articleQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['article', id],
    queryFn: () => fetchArticle(id),
  })

function Article({ id }: { id: number }) {
  const article = useQuery(articleQueryOptions(id))
  if (isPending(article)) return <p>Loading…</p>
  if (isLoadingError(article)) return <p>{article.error.message}</p>
  return <h1>{article.data.title}</h1>
}
```

| Result question             | Named predicates                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| Query status                | `isPending`, `isError`, `isSuccess`                                                                |
| Fetch status and history    | `isFetching`, `isPaused`, `isLoading`, `isRefetching`, `isFetched`                                 |
| Initial or background error | `isLoadingError`, `isRefetchError`                                                                 |
| Page request direction      | `isFetchingNextPage`, `isFetchingPreviousPage`, `isFetchNextPageError`, `isFetchPreviousPageError` |

Predicates read through the tracked result. For example, `isFetching(result)` subscribes a component to `fetchStatus`. If a component supplies `notifyOnChangeProps`, list the source fields there. A change to a source field can trigger a render even when the predicate still returns the same boolean.

`isFetchedAfterMount`, `isPlaceholderData`, `isStale`, and `isEnabled` describe the observer and remain result properties. Mutation results retain their existing status flags. To count fetching queries across a client, call `countFetchingQueries(client, filters)` or subscribe with `useIsFetching(filters)`.

In a component, `isFetched(result)` reads the data and error update counts from the hook's tracked result. In cache management code, `isQueryFetched(entry)` reads those counts directly from a `Query` returned by `findCachedQuery`.

### Paginated queries with the same hook

Choose `infiniteQueryOptions` to handle a pending first page in the component, or `suspenseInfiniteQueryOptions` to show the nearest React fallback. Both forms expose `fetchNextPage`,
`hasNextPage`, and the cached `pages` and `pageParams`.

```tsx
import { suspenseInfiniteQueryOptions, useQuery } from '@tanstack/react-query'

const postPages = suspenseInfiniteQueryOptions({
  queryKey: ['posts', 'pages'],
  initialPageParam: 0,
  queryFn: ({ pageParam }) => fetchPostPage(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})

function Posts() {
  const result = useQuery(postPages)
  return (
    <>
      {result.data.pages.map((page) => (
        <PostList key={page.id} posts={page.posts} />
      ))}
      <button
        disabled={!result.hasNextPage}
        onClick={() => result.fetchNextPage()}
      >
        More posts
      </button>
    </>
  )
}
```

For component-managed loading, prepare the same options with `infiniteQueryOptions`. Outside React, import
`infiniteQuery` to fetch and cache pages by calling `infiniteQuery(client, postPages)`.

### Parallel queries

`useQueries` accepts a dynamic list of regular query options. `useSuspenseQueries` applies its boundary to the entire group and starts the missing requests together. This example renders once both values are available. Each result’s type is inferred independently inside `combine`.

```tsx
import { queryOptions, useSuspenseQueries } from '@tanstack/react-query'

function Dashboard() {
  const summary = useSuspenseQueries({
    queries: [
      queryOptions({ queryKey: ['profile'], queryFn: fetchProfile }),
      queryOptions({ queryKey: ['orders'], queryFn: fetchOrders }),
    ],
    combine: ([profile, orders]) =>
      `${profile.data.name} has ${orders.data.length} orders`,
  })
  return <h1>{summary}</h1>
}
```

Use `useQueries` when the number of keys changes between renders or individual entries can be disabled or skipped. Here the dashboard subscribes to a different set of books whenever the user changes their selection.

```tsx
import { useQueries } from '@tanstack/react-query'

function BookList({ ids }: { ids: number[] }) {
  const books = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['book', id],
      queryFn: () => fetchBook(id),
    })),
  })
  return (
    <ul>
      {books.map((book, index) => (
        <li key={ids[index]}>{book.data?.title ?? book.status}</li>
      ))}
    </ul>
  )
}
```

Filter conditional entries before passing a list to `useSuspenseQueries`.

## Selecting and keeping data

`select` maps the cached value for one observer. `placeholderData` supplies a temporary value for a pending query. Pass an inline callback or a named selector to `select`. Inside `queryOptions`, TypeScript infers the callback's argument from the fetcher and its return type becomes the observer's data type. For example, this hook keeps displaying the previous post title while the next post loads.

```tsx
import {
  keepPreviousData,
  placeholderData,
  queryOptions,
  select,
  useQuery,
} from '@tanstack/react-query'

const postQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id), // Promise<Post>
  })

function usePostTitle(id: number) {
  return useQuery(
    queryOptions({
      ...postQueryOptions(id),
      select: select((post) => post.title),
      placeholderData: placeholderData(keepPreviousData),
    }),
  )
}
```

## Client operations

The `QueryClient` constructor creates the state shared by hooks, providers and imperative callers. All operations on that client are named functions. Pass the client first, followed by the arguments you would pass to the v6 method.

```ts
import {
  query,
  infiniteQuery,
  getQueryData,
  invalidateQueries,
  setQueryData,
} from '@tanstack/react-query'

const order = await query(client, orderOptions)
const cached = getQueryData(client, orderOptions.queryKey)
setQueryData(client, orderOptions.queryKey, updatedOrder)
await infiniteQuery(client, orderPageOptions)
await invalidateQueries(client, { queryKey: ['orders'] })
```

For example, `client.query(options)` becomes `query(client, options)` and `client.clear()` becomes `clearQueryClient(client)`. The provider manages mounting for React users. Integrations that managed the v6 lifecycle directly can call `mountQueryClient(client)` and `unmountQueryClient(client)`. The same client-first convention applies to defaults, mutation resumption and bulk cache operations.

Use `getQueryCache(client)` and `getMutationCache(client)` for direct cache access. Use `findCachedQuery(cache, filters)`, `findCachedQueries(cache, filters)`, or `clearQueryCache(cache)` for query cache searches and clearing. Query caches expose `.subscribe(listener)`, `.get(hash)`, and `.getAll()`. Persistence integrations subscribe through the named accessors and use the same `hydrate` and `dehydrate` exports.

For one cache entry, `getQueryObserverCount(entry)` counts subscribed observers, `invalidateCachedQuery(entry)` marks it invalidated, and `resetCachedQuery(entry)` cancels its fetch and restores its initial state. To apply an operation to matching keys and refetch eligible active matches by default, call `invalidateQueries(client, filters)` or `resetQueries(client, filters)`.

## Mutations

`useMutation`, `useMutationState`, and `useIsMutating` acquire the client's mutation cache on demand. `getMutationCache(client)` creates a default cache on first use or returns a cache supplied to the constructor. A query-only app can omit the mutation cache implementation.

Pass `scope: serialScope('orders')` to `useMutation` to run mutations with that ID one at a time within a cache. The scope ID survives dehydration and hydration. `mutationOptions` preserves the supplied mutation options by reference.
