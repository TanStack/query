import { render } from 'preact'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import App from './App'
import { worker } from './mocks'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

worker.start({ onUnhandledRequest: 'bypass' }).then(() => {
  render(
    <QueryClientProvider client={queryClient}>
      <App />
      <PreactQueryDevtools />
    </QueryClientProvider>,
    rootElement,
  )
})
