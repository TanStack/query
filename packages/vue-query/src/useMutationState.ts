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
  Mutation,
  MutationFilters,
  MutationState,
} from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { MaybeRefDeep } from './types'
import type { MutationCache } from './mutationCache'

type VueMutationFilters = MaybeRefDeep<MutationFilters>

export type UseIsMutatingFilters =
  | VueMutationFilters
  | (() => VueMutationFilters)

/**
 * The `useIsMutating` composable returns a `ref` to the `number` of mutations that your application currently
 * has `pending` (useful for app-wide loading indicators).
 *
 * `filters` may be a plain object, `MaybeRefDeep`, or a reactive getter (`() => ({ ... })`) — pass a getter if
 * the filters themselves depend on other reactive state.
 *
 * @param filters - The {@link MutationFilters} to narrow down the matched mutations.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @returns A `ref` to the `number` of the mutations that your application currently has `pending`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useIsMutating } from '@tanstack/vue-query'
 *
 * // How many mutations matching the posts prefix are in progress?
 * const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
 * </script>
 *
 * <template>
 *   <span v-if="isMutatingPosts">Saving posts...</span>
 * </template>
 * ```
 */
export function useIsMutating(
  filters: UseIsMutatingFilters = {},
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
  filters?: VueMutationFilters
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

/**
 * `useMutationState` is a composable that gives you access to all mutations in the `MutationCache`. You can
 * pass `filters` ({@link MutationFilters}) to narrow down your mutations, and `select` to transform the
 * mutation state.
 *
 * `options` may be a plain object or a reactive getter (`() => ({ ... })`) — pass a getter if the filters
 * themselves depend on other reactive state.
 *
 * @param options - The `filters` to narrow down matched mutations, and an optional `select` to transform the
 * mutation state.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @returns A `ref` to an Array of whatever `select` returns for each matching mutation.
 *
 * @example
 * Get all variables of all running mutations:
 * ```vue
 * <script setup lang="ts">
 * import { useMutationState } from '@tanstack/vue-query'
 *
 * const pendingVariables = useMutationState({
 *   filters: { status: 'pending' },
 *   select: (mutation) => mutation.state.variables,
 * })
 * </script>
 *
 * <template>{{ pendingVariables.length }} posts saving...</template>
 * ```
 *
 * @example
 * Get all data for specific mutations via the `mutationKey`:
 * ```vue
 * <script setup lang="ts">
 * import { useMutation, useMutationState } from '@tanstack/vue-query'
 *
 * const mutationKey = ['posts']
 *
 * // Some mutation that we want to get the state for
 * const mutation = useMutation({
 *   mutationKey,
 *   mutationFn: createPosts,
 * })
 *
 * const savedPosts = useMutationState({
 *   // this mutation key needs to match the mutation key of the given mutation (see above)
 *   filters: { mutationKey, status: 'success' },
 *   select: (mutation) => mutation.state.data,
 * })
 * </script>
 *
 * <template>
 *   <button @click="mutation.mutate(['New Post'])">
 *     Create post ({{ savedPosts.length }} saved so far)
 *   </button>
 * </template>
 * ```
 *
 * @example
 * Access the latest successful mutation data via the `mutationKey`. Each invocation of `mutate` adds a new
 * entry to the mutation cache for `gcTime` milliseconds — with the `status: 'success'` filter below, check the
 * last item that `useMutationState` returns to get the latest successful invocation:
 * ```vue
 * <script setup lang="ts">
 * import { computed } from 'vue'
 * import { useMutationState } from '@tanstack/vue-query'
 *
 * const savedPosts = useMutationState({
 *   filters: { mutationKey: ['posts'], status: 'success' },
 *   select: (mutation) => mutation.state.data,
 * })
 *
 * const latestSavedPost = computed(() => savedPosts.value[savedPosts.value.length - 1])
 * </script>
 *
 * <template>{{ latestSavedPost ? 'Saved' : 'Nothing saved yet' }}</template>
 * ```
 */
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
