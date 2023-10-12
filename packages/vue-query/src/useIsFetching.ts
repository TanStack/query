import {
  computed,
  getCurrentScope,
  onScopeDispose,
  ref,
  unref,
  watchEffect,
} from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref, isQueryKey } from './utils'
import type { Ref } from 'vue-demi'
import type { QueryFilters as QF, QueryKey } from '@tanstack/query-core'

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
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composables like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const filters = computed(() => parseFilterArgs(arg1, arg2))
  const queryClient =
    filters.value.queryClient ?? useQueryClient(filters.value.queryClientKey)

  const isFetching = ref()

  const listener = () => {
    isFetching.value = queryClient.isFetching(filters)
  }

  const unsubscribe = queryClient.getQueryCache().subscribe(listener)

  watchEffect(listener)

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
