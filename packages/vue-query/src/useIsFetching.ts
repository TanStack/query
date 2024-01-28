import { getCurrentScope, onScopeDispose, ref, watchEffect } from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import type { Ref } from 'vue-demi'
import type { QueryFilters as QF } from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'

export type QueryFilters = MaybeRefDeep<QF>

export function useIsFetching(
  fetchingFilters: MaybeRefDeep<QF> = {},
  queryClient?: QueryClient,
): Ref<number> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()

  const isFetching = ref()

  const listener = () => {
    isFetching.value = client.isFetching(fetchingFilters)
  }

  const unsubscribe = client.getQueryCache().subscribe(listener)

  watchEffect(listener)

  onScopeDispose(() => {
    unsubscribe()
  })

  return isFetching
}
