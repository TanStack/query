import { QueryClient, QueryClientProvider } from 'react-query'

import './styles.css'
import Search from './Search'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        <h1>React Query with Algolia</h1>
        <Search />
      </div>
    </QueryClientProvider>
  )
}
