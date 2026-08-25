import { getCurrentScope, onScopeDispose, ref, watchEffect } from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { Ref } from 'vue-demi'
import type { QueryFilters } from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'

export type UseIsFetchingFilters =
  | MaybeRefDeep<QueryFilters>
  | (() => MaybeRefDeep<QueryFilters>)

export function useIsFetching(
  fetchingFilters: UseIsFetchingFilters = {},
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
    const resolvedFilters =
      typeof fetchingFilters === 'function'
        ? fetchingFilters()
        : fetchingFilters
    isFetching.value = client.isFetching(cloneDeepUnref(resolvedFilters))
  }

  const unsubscribe = client.getQueryCache().subscribe(listener)

  watchEffect(listener)

  onScopeDispose(() => {
    unsubscribe()
  })

  return isFetching
}
