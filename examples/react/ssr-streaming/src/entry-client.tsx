import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'

import { Root } from './Root'
import { createQueryClient } from './query-client'

import { hydrateStreamingData } from './hydrate-streaming-data'

const queryClient = createQueryClient()
hydrateStreamingData({ queryClient })

ReactDOM.hydrateRoot(
  document,
  <QueryClientProvider client={queryClient}>
    <Root />
  </QueryClientProvider>,
)
