// @refresh reload
import { MetaProvider, Title } from '@solidjs/meta'
import { A, Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import './app.css'

export default function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5000,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <Router
        root={(props) => (
          <MetaProvider>
            <Title>SolidStart - Basic</Title>
            <a href="/">Home</a>
            <a href="/streamed">Streamed</a>
            <a href="/deferred">Deferred</a>
            <a href="/mixed">Mixed</a>
            <a href="/with-error">With Error</a>
            <a href="/hydration">Hydration</a>
            <A preload={true} href="/prefetch">
              Prefetch
            </A>
            <a href="/batch-methods">Batching Methods</a>
            <Suspense>{props.children}</Suspense>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </QueryClientProvider>
  )
}
