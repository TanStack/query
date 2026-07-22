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

type MutationTypeFromResult<TResult> = [TResult] extends [
  MutationState<
    infer TData,
    infer TError,
    infer TVariables,
    infer TOnMutateResult
  >,
]
  ? Mutation<TData, TError, TVariables, TOnMutateResult>
  : Mutation

export type MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
> = {
  filters?: MutationFilters
  select?: (mutation: TMutation) => TResult
}

function getResult<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult, TMutation>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(mutation as TMutation)
          : mutation.state) as TResult,
    )
}

export function useMutationState<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>(
  options:
    | MutationStateOptions<TResult, TMutation>
    | (() => MutationStateOptions<TResult, TMutation>) = {},
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
