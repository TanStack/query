import {
  computed,
  getCurrentScope,
  onScopeDispose,
  ref,
  unref,
  watchSyncEffect,
} from 'vue-demi'
import { parseFilterArgs } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
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
        'vue-query composables like "uesQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const filters = computed(
    () =>
      cloneDeepUnref(
        parseFilterArgs(
          // @ts-expect-error this is fine
          unref(arg1),
          unref(arg2),
        )[0],
      ) as WithQueryClientKey<QF>,
  )
  const queryClient =
    filters.value.queryClient ?? useQueryClient(filters.value.queryClientKey)

  const isFetching = ref()

  const listener = () => {
    isFetching.value = queryClient.isFetching(filters)
  }

  const unsubscribe = queryClient.getQueryCache().subscribe(listener)

  watchSyncEffect(listener)

  onScopeDispose(() => {
    unsubscribe()
  })

  return isFetching
}
