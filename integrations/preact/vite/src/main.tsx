import { render } from 'preact'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import App from './App'

const queryClient = new QueryClient()

render(
  <QueryClientProvider client={queryClient}>
    <App />
    <PreactQueryDevtools />
  </QueryClientProvider>,
  document.getElementById('root')!,
)
