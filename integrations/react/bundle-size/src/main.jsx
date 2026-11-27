import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '#adapter'
import { client } from '#client'
import { ReadingList } from '#screen'

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={client}>
    <h1>Reading list</h1>
    <ReadingList />
  </QueryClientProvider>,
)
