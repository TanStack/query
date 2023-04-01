import { onScopeDispose, readonly, computed, ref } from 'vue-demi'
import type { Ref, DeepReadonly } from 'vue-demi'
import type {
  MutationFilters as MF,
  Mutation,
  DefaultError,
} from '@tanstack/query-core'
import type { MutationState } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
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

  const length = computed(
    () => useMutationState({ filters: unreffedFilters }, client).value.length,
  )

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
  const mutationCache = (queryClient || useQueryClient()).getMutationCache()
  const state = ref(getResult(mutationCache, options)) as Ref<TResult[]>
  const unsubscribe = mutationCache.subscribe(() => {
    const result = getResult(mutationCache, options)
    state.value = result
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  return readonly(state)
}
