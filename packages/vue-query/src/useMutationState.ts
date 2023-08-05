import { computed, onScopeDispose, readonly, ref, watch } from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { DeepReadonly, Ref } from 'vue-demi'
import type {
  DefaultError,
  MutationFilters as MF,
  Mutation,
  MutationState,
} from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { MaybeRefDeep } from './types'
import type { MutationCache } from './mutationCache'

export type MutationFilters = MaybeRefDeep<MF>

export function useIsMutating(
  filters: MutationFilters = {},
  queryClient?: QueryClient,
): Ref<number> {
  const client = queryClient || useQueryClient()
  const unreffedFilters = computed(() => ({
    ...cloneDeepUnref(filters),
    status: 'pending' as const,
  }))

  const mutationState = useMutationState({ filters: unreffedFilters }, client)
  const length = computed(() => mutationState.value.length)

  return length
}

export type MutationStateOptions<TResult = MutationState> = {
  filters?: MutationFilters
  select?: (
    mutation: Mutation<unknown, DefaultError, unknown, unknown>,
  ) => TResult
}

function getResult<TResult = MutationState>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(
              mutation as Mutation<unknown, DefaultError, unknown, unknown>,
            )
          : mutation.state) as TResult,
    )
}

export function useMutationState<TResult = MutationState>(
  options: MutationStateOptions<TResult> = {},
  queryClient?: QueryClient,
): DeepReadonly<Ref<Array<TResult>>> {
  const filters = computed(() => cloneDeepUnref(options.filters))
  const mutationCache = (queryClient || useQueryClient()).getMutationCache()
  const state = ref(getResult(mutationCache, options)) as Ref<TResult[]>
  const unsubscribe = mutationCache.subscribe(() => {
    const result = getResult(mutationCache, options)
    state.value = result
  })

  watch(filters, () => {
    state.value = getResult(mutationCache, options)
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  return readonly(state)
}
