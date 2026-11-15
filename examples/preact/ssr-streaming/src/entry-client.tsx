import { hydrate as preactHydrate } from 'preact'
import { QueryClientProvider, hydrate } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import App from './App'
import { makeQueryClient } from './makeQueryClient'
import type { DehydratedState } from '@tanstack/preact-query'

declare global {
  interface Window {
    __QUERY_STATES__: Array<DehydratedState>
  }
}

const queryClient = makeQueryClient()

for (const state of window.__QUERY_STATES__) {
  hydrate(queryClient, state)
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

preactHydrate(
  <QueryClientProvider client={queryClient}>
    <App />
    <PreactQueryDevtools />
  </QueryClientProvider>,
  rootElement,
)
