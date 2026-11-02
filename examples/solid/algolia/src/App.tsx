import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { SolidQueryDevtools } from '@tanstack/solid-query-devtools'

import './styles.css'
import Search from './Search'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div class="App">
        <h1>TanStack Query with Algolia</h1>
        <Search />
      </div>
      <SolidQueryDevtools initialIsOpen />
    </QueryClientProvider>
  )
}
