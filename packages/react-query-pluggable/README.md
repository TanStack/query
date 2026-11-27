# @tanstack/react-query-pluggable

An experimental ESM React Query adapter for React 19. A `QueryClient` holds cache state and configuration. Import client operations and optional query features where you use them.

The React adapter depends on `@tanstack/query-core-pluggable`, which owns the cache, observers, client operations and optional features. The React entry re-exports that core. Direct core callers and React components can use the same pluggable client, cache and managers.

```tsx
import {
  QueryClient,
  QueryClientProvider,
  refetchInterval,
  queryOptions,
  useQuery,
} from '@tanstack/react-query-pluggable'

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

`useQuery`, `useInfiniteQuery`, `useSuspenseQuery` and `useSuspenseInfiniteQuery` accept the same helper, as do query defaults. Pass a callback to compute the next interval from the cached query. Return `false` or `undefined` to stop polling.

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

| Reader                                        | Ordinary query                            | Paginated query                                   |
| --------------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| Component handles pending state               | `useQuery(queryOptions(options))`         | `useQuery(infiniteQueryOptions(options))`         |
| React Suspense boundary handles pending state | `useQuery(suspenseQueryOptions(options))` | `useQuery(suspenseInfiniteQueryOptions(options))` |

```tsx
import {
  queryOptions,
  suspenseQueryOptions,
  useQuery,
} from '@tanstack/react-query-pluggable'

const postOptions = (id: number) => ({
  queryKey: ['post', id],
  queryFn: () => fetchPost(id),
})

function PostPreview({ id }: { id: number }) {
  const post = useQuery(queryOptions(postOptions(id)))
  return <p>{post.isPending ? 'Loading…' : post.data?.title}</p>
}

// Render inside <Suspense fallback={<p>Loading…</p>}>.
function PostTitle({ id }: { id: number }) {
  const post = useQuery(suspenseQueryOptions(postOptions(id)))
  return <h1>{post.data.title}</h1>
}
```

The Suspense policy sends a failed query without cached data to the nearest error boundary.
Passing `skipToken` skips the fetch and can yield undefined data. `useSuspenseQuery(options)`
accepts raw options and prepares its own descriptor. Suspense factories own `enabled` and `throwOnError`. Use `skipToken` for a conditional Suspense query.

### Paginated queries with the same hook

Choose `infiniteQueryOptions` to handle a pending first page in the component, or `suspenseInfiniteQueryOptions` to show the nearest React fallback. Both forms expose `fetchNextPage`,
`hasNextPage`, and the cached `pages` and `pageParams`.

```tsx
import {
  suspenseInfiniteQueryOptions,
  useQuery,
} from '@tanstack/react-query-pluggable'

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
`fetchInfiniteQuery` to fetch and cache pages by calling `fetchInfiniteQuery(client, postPages)`.

### Parallel queries

`useQueries` accepts a dynamic list of regular query options. `useSuspenseQueries` applies its boundary to the entire group and starts the missing requests together. This example renders once both values are available. Each result’s type is inferred independently inside `combine`.

```tsx
import {
  queryOptions,
  useSuspenseQueries,
} from '@tanstack/react-query-pluggable'

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

Use `useQueries` when individual entries can be disabled or skipped. Filter conditional entries before passing the list to `useSuspenseQueries`.

## Selecting and keeping data

`select` maps the cached value for one observer. `placeholderData` supplies a temporary value for a pending query. Wrap a typed selector in `select(getTitle)`, or use the tuple form to infer an inline callback's argument from the query. For example, this hook keeps displaying the previous post title while the next post loads.

```tsx
import {
  keepPreviousData,
  placeholderData,
  queryOptions,
  select,
  useQuery,
} from '@tanstack/react-query-pluggable'

function usePostTitle(id: number) {
  return useQuery(
    queryOptions({
      queryKey: ['post', id],
      queryFn: () => fetchPost(id), // Promise<{ title: string }>
      select: [select, (post) => post.title],
      placeholderData: placeholderData(keepPreviousData),
    }),
  )
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

Pass `scope: serialScope('orders')` to `useMutation` to run mutations with that ID one at a time within a cache. The scope ID survives dehydration and hydration. `mutationOptions` preserves the supplied mutation options by reference.
