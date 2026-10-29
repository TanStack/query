import { dehydrate } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'

// Shared by the server loaders that hand their prefetched queries to the browser.
export function hydrationData(queryClient: QueryClient) {
  return { dehydratedState: dehydrate(queryClient) }
}
