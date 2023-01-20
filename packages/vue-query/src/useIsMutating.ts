import { computed, unref, onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { MutationFilters as MF } from '@tanstack/query-core'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'

export type MutationFilters = MaybeRefDeep<MF>

export function useIsMutating(
  mutationFilters: MutationFilters = {},
  queryClient?: QueryClient,
): Ref<number> {
  const filters = computed(() => unrefFilterArgs(mutationFilters))
  const client = queryClient || useQueryClient()

  const isMutating = ref(client.isMutating(filters))

  const unsubscribe = client.getMutationCache().subscribe(() => {
    isMutating.value = client.isMutating(filters)
  })

  watch(
    filters,
    () => {
      isMutating.value = client.isMutating(filters)
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  return isMutating
}

export function unrefFilterArgs(arg: MutationFilters) {
  const options = unref(arg)
  return cloneDeepUnref(options) as MF
}
