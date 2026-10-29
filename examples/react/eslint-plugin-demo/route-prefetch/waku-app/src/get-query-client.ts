import { cache } from 'react'
import { QueryClient } from '@tanstack/react-query'

/** One QueryClient per server request, shared by the root, layouts and page. */
export const getQueryClient = cache(
  () =>
    new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } }),
)
