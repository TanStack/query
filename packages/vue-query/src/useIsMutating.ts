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
import type { MutationFilters as MF, MutationKey } from '@tanstack/query-core'

import type { MaybeRef, MaybeRefDeep, WithQueryClientKey } from './types'

export type MutationFilters = MaybeRefDeep<WithQueryClientKey<MF>>

export function useIsMutating(filters?: MutationFilters): Ref<number>
export function useIsMutating(
  mutationKey?: MaybeRef<MutationKey>,
  filters?: Omit<MutationFilters, 'mutationKey'>,
): Ref<number>
export function useIsMutating(
  arg1?: MaybeRef<MutationKey> | MutationFilters,
  arg2?: Omit<MutationFilters, 'mutationKey'>,
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

  const isMutating = ref()

  const listener = () => {
    isMutating.value = queryClient.isMutating(filters)
  }

  const unsubscribe = queryClient.getMutationCache().subscribe(listener)

  watchEffect(listener)

  onScopeDispose(() => {
    unsubscribe()
  })

  return isMutating
}

export function parseFilterArgs(
  arg1?: MaybeRef<MutationKey> | MutationFilters,
  arg2: MutationFilters = {},
) {
  const plainArg1 = unref(arg1)
  const plainArg2 = unref(arg2)

  let options = plainArg1

  if (isQueryKey(plainArg1)) {
    options = { ...plainArg2, mutationKey: plainArg1 }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    options = plainArg1 || {}
  }

  return cloneDeepUnref(options) as WithQueryClientKey<MF>
}
