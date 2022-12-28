import { computed, unref, onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { MutationFilters as MF } from '@tanstack/query-core'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { MaybeRefDeep, WithQueryClientKey } from './types'

export type MutationFilters = MaybeRefDeep<WithQueryClientKey<MF>>

export function useIsMutating(
  mutationFilters: MutationFilters = {},
): Ref<number> {
  const filters = computed(() => unrefFilterArgs(mutationFilters))
  const queryClient =
    filters.value.queryClient ?? useQueryClient(filters.value.queryClientKey)

  const isMutating = ref(queryClient.isMutating(filters))

  const unsubscribe = queryClient.getMutationCache().subscribe(() => {
    isMutating.value = queryClient.isMutating(filters)
  })

  watch(
    filters,
    () => {
      isMutating.value = queryClient.isMutating(filters)
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
  return cloneDeepUnref(options) as WithQueryClientKey<MF>
}
