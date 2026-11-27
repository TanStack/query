import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '#adapter'
import { ReadingList } from '#screen'

export function mount(container) {
  const root = createRoot(container)
  const client = new QueryClient()
  root.render(
    <QueryClientProvider client={client}>
      <ReadingList />
    </QueryClientProvider>,
  )
  return () => root.unmount()
}
