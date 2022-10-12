import { onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { MutationKey, MutationFilters as MF } from '@tanstack/query-core'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref, isQueryKey } from './utils'
import type { MaybeRefDeep, WithQueryClientKey } from './types'

export type MutationFilters = MaybeRefDeep<WithQueryClientKey<MF>>

export function useIsMutating(filters?: MutationFilters): Ref<number>
export function useIsMutating(
  mutationKey?: MutationKey,
  filters?: Omit<MutationFilters, 'mutationKey'>,
): Ref<number>
export function useIsMutating(
  arg1?: MutationKey | MutationFilters,
  arg2?: Omit<MutationFilters, 'mutationKey'>,
): Ref<number> {
  const filters = ref(parseMutationFilterArgs(arg1, arg2))
  const queryClient =
    filters.value.queryClient ?? useQueryClient(filters.value.queryClientKey)

  const isMutating = ref(queryClient.isMutating(filters))

  const unsubscribe = queryClient.getMutationCache().subscribe(() => {
    isMutating.value = queryClient.isMutating(filters)
  })

  watch(
    [() => arg1, () => arg2],
    () => {
      filters.value = parseMutationFilterArgs(arg1, arg2)
      isMutating.value = queryClient.isMutating(filters)
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  return isMutating
}

export function parseMutationFilterArgs(
  arg1?: MutationKey | MutationFilters,
  arg2: MutationFilters = {},
) {
  let options: MutationFilters

  if (isQueryKey(arg1)) {
    options = { ...arg2, mutationKey: arg1 }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    options = arg1 || {}
  }

  return cloneDeepUnref(options) as WithQueryClientKey<MF>
}
