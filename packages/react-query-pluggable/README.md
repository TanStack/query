# @tanstack/react-query-pluggable

An experimental ESM React Query adapter for React 19. A `QueryClient` holds cache state and configuration. Import client operations and optional query features where you use them.

The adapter uses `@tanstack/query-core` for fetching retries, cancellation, garbage collection, key comparison and structural sharing. It also uses the same focus, online, timeout and environment managers as the other adapters. Configuring one of those managers affects every adapter that uses that copy of core.

```tsx
import {
  QueryClient,
  QueryClientProvider,
  refetchInterval,
  useQuery,
} from '@tanstack/react-query-pluggable'

const client = new QueryClient()

function Orders() {
  const { data } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    refetchInterval: refetchInterval(3000),
  })
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

`useQuery`, `useInfiniteQuery`, `useSuspenseQuery` and `useSuspenseInfiniteQuery` accept the same helper, as do query defaults. Pass a callback to compute the next interval from the cached query. Return `false` or `undefined` to stop polling.

```ts
useQuery({
  queryKey: ['job', jobId],
  queryFn: () => fetchJob(jobId),
  refetchInterval: (query) =>
    query.state.data?.status === 'complete' ? false : refetchInterval(3000),
})
```

Polling runs while an enabled observer has subscribers and the window is focused. Set `refetchIntervalInBackground: true` to keep polling in the background. Each observer manages its own timer, including when several observers share a client default.

## Choosing how a query renders

`useQuery(query(options))` returns a pending result while an uncached query loads. Pass
`suspenseQuery(options)` to the same hook to show the nearest React `<Suspense>` fallback
until data is available. Both readers use the same client and cache key. The `query` export
is an alias of `queryOptions`. Only `suspenseQuery` imports the single-query Suspense policy.

```tsx
import { query, suspenseQuery, useQuery } from '@tanstack/react-query-pluggable'

const postOptions = (id: number) =>
  query({ queryKey: ['post', id], queryFn: () => fetchPost(id) })

function PostPreview({ id }: { id: number }) {
  const post = useQuery(postOptions(id))
  return <p>{post.isPending ? 'Loading…' : post.data?.title}</p>
}

// Render inside <Suspense fallback={<p>Loading…</p>}>.
function PostTitle({ id }: { id: number }) {
  const post = useQuery(suspenseQuery(postOptions(id)))
  return <h1>{post.data.title}</h1>
}
```

The Suspense policy sends a failed query without cached data to the nearest error boundary.
Passing `skipToken` skips the fetch and can yield undefined data. `useSuspenseQuery(options)`
is a shorthand for `useQuery(suspenseQuery(options))`.

### Paginated queries with the same hook

Build the observer with `infiniteQuery`. Wrap those options in `suspenseQuery` when React
should show a parent fallback while loading the first page. Both forms expose `fetchNextPage`,
`hasNextPage`, and the cached `pages` and `pageParams`.

```tsx
import {
  infiniteQuery,
  suspenseQuery,
  useQuery,
} from '@tanstack/react-query-pluggable'

const postPages = infiniteQuery({
  queryKey: ['posts', 'pages'],
  initialPageParam: 0,
  queryFn: ({ pageParam }) => fetchPostPage(pageParam),
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})

function Posts() {
  const result = useQuery(suspenseQuery(postPages))
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

Use `useQuery(postPages)` to handle the pending state inside the component. Outside React, import
`fetchInfiniteQuery` to fetch and cache pages by calling `fetchInfiniteQuery(client, postPages)`.

## Selecting and keeping data

`select` maps the cached value for one observer. `placeholderData` supplies a temporary value for a pending query. Wrap a typed selector in `select(getTitle)`, or use the tuple form to infer an inline callback's argument from the query. For example, this hook keeps displaying the previous post title while the next post loads.

```tsx
import {
  keepPreviousData,
  placeholderData,
  select,
  useQuery,
} from '@tanstack/react-query-pluggable'

function usePostTitle(id: number) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id), // Promise<{ title: string }>
    select: [select, (post) => post.title],
    placeholderData: placeholderData(keepPreviousData),
  })
}
```

## Client operations

The `QueryClient` constructor creates the state shared by hooks, providers and imperative callers. All operations on that client are named functions. Pass the client first, followed by the arguments you would pass to the v6 method.

```ts
import {
  fetchQuery,
  fetchInfiniteQuery,
  getQueryData,
  invalidateQueries,
  setQueryData,
} from '@tanstack/react-query-pluggable'

const order = await fetchQuery(client, orderOptions)
const cached = getQueryData(client, orderOptions.queryKey)
setQueryData(client, orderOptions.queryKey, updatedOrder)
await fetchInfiniteQuery(client, orderPageOptions)
await invalidateQueries(client, { queryKey: ['orders'] })
```

For example, `client.query(options)` becomes `fetchQuery(client, options)` and `client.clear()` becomes `clearQueryClient(client)`. The provider manages mounting for React users. Integrations that managed the v6 lifecycle directly can call `mountQueryClient(client)` and `unmountQueryClient(client)`. The same client-first convention applies to defaults, mutation resumption and bulk cache operations.

Use `getQueryCache(client)` and `getMutationCache(client)` for direct cache access. Cache objects keep methods such as `.subscribe(listener)`, `.find(filters)`, and `.getAll()`. The stock `@tanstack/query-persist-client-core` subscription calls `client.getQueryCache()` and `client.getMutationCache()`. A custom persistence integration for this adapter must subscribe through the named accessors and use this adapter’s `hydrate` and `dehydrate`.

## Mutations

`useMutation`, `useMutationState`, and `useIsMutating` acquire the client's mutation cache on demand. `getMutationCache(client)` creates a default cache on first use or returns a cache supplied to the constructor. A query-only app can omit the mutation cache implementation.

Pass `scope: serialScope('orders')` to `useMutation` to run mutations with that ID one at a time within a cache. The scope ID survives dehydration and hydration. The `queryOptions`, `infiniteQueryOptions`, and `mutationOptions` helpers preserve their TypeScript inference and share one JavaScript identity function.
