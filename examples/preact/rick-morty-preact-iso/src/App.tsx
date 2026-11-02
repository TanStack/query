import { LocationProvider } from 'preact-iso'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { PreactQueryDevtools } from '@tanstack/preact-query-devtools'
import Layout from './Layout'

import './styles.css'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <Layout />
        <PreactQueryDevtools initialIsOpen />
      </LocationProvider>
    </QueryClientProvider>
  )
}
