import { computed, onScopeDispose, ref, watch } from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { Ref } from 'vue-demi'
import type { QueryFilters as QF } from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'

export type QueryFilters = MaybeRefDeep<QF>

export function useIsFetching(
  fetchingFilters: MaybeRefDeep<QF> = {},
  queryClient?: QueryClient,
): Ref<number> {
  const filters = computed(() => cloneDeepUnref(fetchingFilters))
  const client = queryClient || useQueryClient()

  const isFetching = ref(client.isFetching(filters))

  const unsubscribe = client.getQueryCache().subscribe(() => {
    isFetching.value = client.isFetching(filters)
  })

  watch(filters, () => {
    isFetching.value = client.isFetching(filters)
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  return isFetching
}
