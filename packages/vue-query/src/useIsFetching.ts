import { computed, onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { QueryFilters as QF } from '@tanstack/query-core'
import { isServer } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref, noop } from './utils'
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

  // Nuxt2 memory leak fix - do not subscribe on server
  const unsubscribe = isServer
    ? noop
    : client.getQueryCache().subscribe(() => {
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
