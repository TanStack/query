import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '#adapter'
import { ReadingList } from '#screen'

const client = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={client}>
    <h1>Reading list</h1>
    <ReadingList />
  </QueryClientProvider>,
)
