# @tanstack/react-query-no-core-pluggable

An experimental ESM React Query adapter for React 19. Create a regular `QueryClient` to use queries, infinite queries and mutations. Import `refetchInterval` to enable polling for an observer.

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
