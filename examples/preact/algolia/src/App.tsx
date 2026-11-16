import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'

import './styles.css'
import Search from './Search'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <h1>TanStack Query with Algolia</h1>
        <Search />
      </div>
      <PreactQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}
