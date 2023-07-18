import { getCurrentInstance, inject } from 'vue-demi'

import { getClientKey } from './utils'
import type { QueryClient } from './queryClient'

export function useQueryClient(id = ''): QueryClient {
  const vm = getCurrentInstance()?.proxy

  if (!vm) {
    throw new Error('vue-query hooks can only be used inside setup() function.')
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
