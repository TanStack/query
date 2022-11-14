import { computed, isRef, onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { QueryKey, QueryFilters as QF } from '@tanstack/query-core'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref, isQueryKey } from './utils'
import type { MaybeRef, MaybeRefDeep, WithQueryClientKey } from './types'

export type QueryFilters = MaybeRefDeep<WithQueryClientKey<QF>>

export function useIsFetching(filters?: QueryFilters): Ref<number>
export function useIsFetching(
  queryKey?: MaybeRef<QueryKey>,
  filters?: Omit<QueryFilters, 'queryKey'>,
): Ref<number>
export function useIsFetching(
  arg1?: MaybeRef<QueryKey> | QueryFilters,
  arg2?: Omit<QueryFilters, 'queryKey'>,
): Ref<number> {
  const filters = computed(() => parseFilterArgs(arg1, arg2))
  const queryClient =
    filters.value.queryClient ?? useQueryClient(filters.value.queryClientKey)

  const isFetching = ref(queryClient.isFetching(filters))

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    isFetching.value = queryClient.isFetching(filters)
  })

  watch(
    filters,
    () => {
      isFetching.value = queryClient.isFetching(filters)
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  return isFetching
}

export function parseFilterArgs(
  arg1?: MaybeRef<QueryKey> | QueryFilters,
  arg2: QueryFilters = {},
) {
  const plainArg1 = isRef(arg1) ? arg1.value : arg1
  const plainArg2 = isRef(arg2) ? arg2.value : arg2

  let options = plainArg1

  if (isQueryKey(plainArg1)) {
    options = { ...plainArg2, queryKey: plainArg1 }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    options = plainArg1 || {}
  }

  return cloneDeepUnref(options) as WithQueryClientKey<QF>
}
