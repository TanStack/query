# @tanstack/react-query-no-core-pluggable

An experimental ESM React Query adapter for React 19. The default client supports ordinary queries, including suspense, parallel queries, prefetching and query hydration.

```tsx
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query-no-core-pluggable'

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

Import the plugins your application uses and register them on its client. Each client installs its own plugins and owns its caches.

```ts
import {
  QueryClient,
  infiniteQueryPlugin,
  mutationPlugin,
} from '@tanstack/react-query-no-core-pluggable'

const client = new QueryClient({
  plugins: [infiniteQueryPlugin, mutationPlugin],
})
```

- `infiniteQueryPlugin` enables paginated fetching through `useInfiniteQuery`, `client.infiniteQuery` and their related APIs. Install it when restoring infinite queries from a server snapshot.
- `mutationPlugin` enables mutation observers, mutation state subscriptions and mutation hydration. To supply a custom cache, pass `mutationCache` alongside the plugin.
