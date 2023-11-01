import { hasInjectionContext, inject } from 'vue-demi'

import { getClientKey } from './utils'
import type { QueryClient } from './queryClient'

export function useQueryClient(id = ''): QueryClient {
  // ensures that `inject()` can be used
  if (!hasInjectionContext()) {
    throw new Error(
      'vue-query hooks can only be used inside setup() function or functions that support injection context.',
    )
  }

  const key = getClientKey(id)
  const queryClient = inject<QueryClient>(key)

  if (!queryClient) {
    throw new Error(
      "No 'queryClient' found in Vue context, use 'VueQueryPlugin' to properly initialize the library.",
    )
  }

  return queryClient
}
