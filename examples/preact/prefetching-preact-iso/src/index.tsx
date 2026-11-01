import { render } from 'preact'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import App from './App'

const queryClient = new QueryClient()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing #root element')

render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  rootElement,
)
