import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowReadonly,
  shallowRef,
  watch,
} from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type { Ref } from 'vue-demi'
import type {
  MutationFilters as MF,
  Mutation,
  MutationState,
} from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { MaybeRefDeep } from './types'
import type { MutationCache } from './mutationCache'

export type MutationFilters = MaybeRefDeep<MF>

export function useIsMutating(
  filters: MutationFilters | (() => MutationFilters) = {},
  queryClient?: QueryClient,
): Ref<number> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()

  const mutationState = useMutationState(
    {
      filters: computed(() => ({
        ...cloneDeepUnref(typeof filters === 'function' ? filters() : filters),
        status: 'pending' as const,
      })),
    },
    client,
  )
  const length = computed(() => mutationState.value.length)

  return length
}

export type MutationStateOptions<TResult = MutationState> = {
  filters?: MutationFilters
  select?: (mutation: Mutation) => TResult
}

function getResult<TResult = MutationState>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select ? options.select(mutation) : mutation.state) as TResult,
    )
}

/**
 * Gets the state of mutations in the cache.
 *
 * @template TMutation - Narrows the type of the `mutation` argument passed to `select`. This is a caller-side assertion — the mutation cache stores mutations as the base `Mutation` type, so it is the caller's responsibility to ensure `TMutation` matches the actual mutations in the cache (e.g. by specifying a `mutationKey` in `filters`).
 */
export function useMutationState<TResult = MutationState, TMutation extends Mutation<any, any, any, any> = Mutation<any, any, any, any>>(
  options:
    | MutationStateOptions<TResult>
    | (() => MutationStateOptions<TResult>) = {},
  queryClient?: QueryClient,
): Readonly<Ref<Array<TResult>>> {
  const resolvedOptions = computed(() => {
    const newOptions = typeof options === 'function' ? options() : options
    return {
      filters: cloneDeepUnref(newOptions.filters),
      select: newOptions.select,
    }
  })
  const mutationCache = (queryClient || useQueryClient()).getMutationCache()
  const state = shallowRef(getResult(mutationCache, resolvedOptions.value))
  const unsubscribe = mutationCache.subscribe(() => {
    state.value = getResult(mutationCache, resolvedOptions.value)
  })

  watch(resolvedOptions, () => {
    state.value = getResult(mutationCache, resolvedOptions.value)
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  return shallowReadonly(state)
}