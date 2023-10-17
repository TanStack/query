/* @refresh reload */
import { render } from 'solid-js/web'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'
import App from './App'

const queryClient = new QueryClient()

const root = document.getElementById('root')

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <SolidQueryDevtools />
      <App />
    </QueryClientProvider>
  ),
  root,
)
