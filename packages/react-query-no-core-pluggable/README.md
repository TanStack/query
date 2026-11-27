# @tanstack/react-query-no-core-pluggable

An experimental ESM React Query adapter for React 19. Create a regular `QueryClient` to use queries, infinite queries and mutations. Import optional features where you use them.

```tsx
import {
  QueryClient,
  QueryClientProvider,
  refetchInterval,
  useQuery,
} from '@tanstack/react-query-no-core-pluggable'

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

## Selecting and keeping data

`select` maps the cached value for one observer. `placeholderData` supplies a temporary value for a pending query. Wrap a typed selector in `select(getTitle)`, or use the tuple form to infer an inline callback's argument from the query. For example, this hook keeps displaying the previous post title while the next post loads.

```tsx
import {
  keepPreviousData,
  placeholderData,
  select,
  useQuery,
} from '@tanstack/react-query-no-core-pluggable'

function usePostTitle(id: number) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id), // Promise<{ title: string }>
    select: [select, (post) => post.title],
    placeholderData: placeholderData(keepPreviousData),
  })
}
```

## Mutations and cache operations

Pass `scope: serialScope('orders')` to `useMutation` to run mutations with that ID one at a time within a cache. Multiple calls to `serialScope('orders')` share the queue. The scope ID survives dehydration and hydration.

Imperative infinite queries and bulk cache operations are named exports. Pass the client as the first argument.

```ts
import {
  infiniteQuery,
  invalidateQueries,
} from '@tanstack/react-query-no-core-pluggable'

await infiniteQuery(client, orderPageOptions)
await invalidateQueries(client, { queryKey: ['orders'] })
```

The other bulk operations are `getQueriesData`, `setQueriesData`, `removeQueries`, `resetQueries`, `cancelQueries`, and `refetchQueries`. Single-query access such as `client.getQueryData(key)` stays on the client. All three option helpers (`queryOptions`, `infiniteQueryOptions`, and `mutationOptions`) return their argument unchanged and share one JavaScript implementation.
