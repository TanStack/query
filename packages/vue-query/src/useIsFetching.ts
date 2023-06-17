import { computed, unref, onScopeDispose, ref, watch } from 'vue-demi'
import type { Ref } from 'vue-demi'
import type { QueryKey, QueryFilters as QF } from '@tanstack/query-core'
import { isServer } from '@tanstack/query-core'

import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref, isQueryKey, noop } from './utils'
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

  // Nuxt2 memory leak fix - do not subscribe on server
  const unsubscribe = isServer
    ? noop
    : queryClient.getQueryCache().subscribe(() => {
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
  const plainArg1 = unref(arg1)
  const plainArg2 = unref(arg2)

  let options = plainArg1

  if (isQueryKey(plainArg1)) {
    options = { ...plainArg2, queryKey: plainArg1 }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    options = plainArg1 || {}
  }

  return cloneDeepUnref(options) as WithQueryClientKey<QF>
}
