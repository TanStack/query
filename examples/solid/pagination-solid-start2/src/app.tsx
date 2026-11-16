import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

export default function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <Router root={(props) => <Suspense>{props.children}</Suspense>}>
        <FileRoutes />
      </Router>
    </QueryClientProvider>
  )
}
