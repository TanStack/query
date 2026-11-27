# @tanstack/react-query-no-core

An experimental ESM adapter for React 19 with its own query runtime. Import the client, provider and hooks from this package. Its client includes mutations and infinite queries by default.

```tsx
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query-no-core'

const client = new QueryClient()

function Greeting() {
  const { data } = useQuery({
    queryKey: ['greeting'],
    queryFn: () => Promise.resolve('Hello'),
  })
  return <p>{data}</p>
}

export function App() {
  return (
    <QueryClientProvider client={client}>
      <Greeting />
    </QueryClientProvider>
  )
}
```

The original adapter and both experimental adapters share their TypeScript definitions through `@tanstack/query-types`. Each React adapter owns its provider context and each client owns its caches.

Use v6 option values directly, including `select: (data) => data.title`, `refetchInterval: 3000`, and `scope: { id: 'orders' }`. Imperative operations stay on the client, for example `client.infiniteQuery(options)` and `client.invalidateQueries({ queryKey: ['orders'] })`. The `queryOptions`, `infiniteQueryOptions`, and `mutationOptions` helpers all return their argument unchanged and share one JavaScript implementation.

React batches subscriber updates. Use `notifyManager.setScheduler` to choose when notifications run, or `setNotifyFunction` to wrap them in `act` during tests. To inspect the queries in a `QueriesObserver`, call `observer.getObservers().map((item) => item.getCurrentQuery())`.
