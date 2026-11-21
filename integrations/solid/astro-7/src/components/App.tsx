import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { ErrorBoundary, Suspense } from 'solid-js'

const Example = () => {
  const query = useQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 1000))
      return 'Success'
    },
  }))

  return (
    <ErrorBoundary fallback="An error has occurred!">
      <Suspense fallback="Loading...">
        <div>{query.data}</div>
      </Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <Example />
    </QueryClientProvider>
  )
}
