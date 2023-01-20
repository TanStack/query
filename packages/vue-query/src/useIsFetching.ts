import { computed, unref, onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { QueryFilters as QF } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'

export type QueryFilters = MaybeRefDeep<QF>

export function useIsFetching(
  fetchingFilters: QueryFilters = {},
  queryClient?: QueryClient,
): Ref<number> {
  const filters = computed(() => unrefFilterArgs(fetchingFilters))
  const client = queryClient || useQueryClient()

  const isFetching = ref(client.isFetching(filters))

  const unsubscribe = client.getQueryCache().subscribe(() => {
    isFetching.value = client.isFetching(filters)
  })

  watch(
    filters,
    () => {
      isFetching.value = client.isFetching(filters)
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  return isFetching
}

export function unrefFilterArgs(arg: QueryFilters) {
  const options = unref(arg)
  return cloneDeepUnref(options) as QF
}
