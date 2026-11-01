import { hydrate } from 'preact'
import { useState } from 'preact/hooks'
import { HydrationBoundary, QueryClientProvider } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import App from './App'
import { makeQueryClient } from './makeQueryClient'
import type { DehydratedState } from '@tanstack/preact-query'

declare global {
  interface Window {
    __DEHYDRATED_STATE__: DehydratedState
  }
}

function Root({ dehydratedState }: { dehydratedState: DehydratedState }) {
  const [queryClient] = useState(() => makeQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <App />
      </HydrationBoundary>
      <PreactQueryDevtools />
    </QueryClientProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

hydrate(<Root dehydratedState={window.__DEHYDRATED_STATE__} />, rootElement)
