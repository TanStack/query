import {
  computed,
  getCurrentScope,
  onScopeDispose,
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  toRefs,
  watch,
} from 'vue-demi'
import { MutationObserver, shouldThrowError } from '@tanstack/query-core'
import { cloneDeepUnref, updateState } from './utils'
import { useQueryClient } from './useQueryClient'
import type { ToRefs } from 'vue-demi'
import type {
  DefaultError,
  DistributiveOmit,
  MutateFunction,
  MutationObserverResult,
} from '@tanstack/query-core'
import type { MaybeRefDeep, MutationOptions } from './types'
import type { QueryClient } from './queryClient'

type MutationResult<TData, TError, TVariables, TOnMutateResult> =
  DistributiveOmit<
    MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
    'mutate' | 'reset'
  >

export type UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> =
  | MaybeRefDeep<MutationOptions<TData, TError, TVariables, TOnMutateResult>>
  | (() => MaybeRefDeep<
      MutationOptions<TData, TError, TVariables, TOnMutateResult>
    >)

type MutateSyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (
  ...options: Parameters<
    MutateFunction<TData, TError, TVariables, TOnMutateResult>
  >
) => void

export type UseMutationReturnType<
  TData,
  TError,
  TVariables,
  TOnMutateResult,
  TResult = MutationResult<TData, TError, TVariables, TOnMutateResult>,
> = ToRefs<Readonly<TResult>> & {
  mutate: MutateSyncFunction<TData, TError, TVariables, TOnMutateResult>
  mutateAsync: MutateFunction<TData, TError, TVariables, TOnMutateResult>
  reset: MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >['reset']
}

/**
 * Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
 * `useMutation` is the composable for that.
 *
 * `mutationOptions` may be a plain object, a `ref`, or a reactive getter (`() => ({ ... })`) — pass a getter
 * if the options themselves depend on other reactive state.
 *
 * @see {@link mutationOptions} to share these options across multiple `useMutation` call sites, or to look
 * the mutation up elsewhere via its `mutationKey` (e.g. with `useMutationState`).
 * @param mutationOptions - The {@link UseMutationOptions} to use — everything you can pass to `useMutation`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @returns `mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
 * argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
 * mutation definition. Hook-level callbacks (passed to `mutationOptions`) fire for every mutation; per-call
 * callbacks fire only for the latest call you've made.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useMutation, useQueryClient } from '@tanstack/vue-query'
 *
 * const queryClient = useQueryClient()
 *
 * const addMutation = useMutation({
 *   mutationFn: addTodo,
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 * })
 *
 * function onAdd() {
 *   addMutation.mutate('Item', {
 *     onError: (error) => console.error('Failed to add item:', error),
 *   })
 * }
 * </script>
 *
 * <template>
 *   <button @click="onAdd">Add</button>
 * </template>
 * ```
 *
 * @example
 * Rendering the mutation's own state, rather than just firing it off:
 * ```vue
 * <script setup lang="ts">
 * import { useMutation, useQueryClient } from '@tanstack/vue-query'
 *
 * const queryClient = useQueryClient()
 *
 * const addMutation = useMutation({
 *   mutationFn: addTodo,
 *   onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 * })
 * </script>
 *
 * <template>
 *   <div v-if="addMutation.isPending.value">Adding todo...</div>
 *   <div v-else>
 *     <div v-if="addMutation.isError.value">An error occurred: {{ addMutation.error.value.message }}</div>
 *     <button @click="addMutation.mutate('Item')">Add</button>
 *   </div>
 * </template>
 * ```
 */
export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  mutationOptions: UseMutationOptions<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
  queryClient?: QueryClient,
): UseMutationReturnType<TData, TError, TVariables, TOnMutateResult> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()
  const options = computed(() => {
    const resolvedOptions =
      typeof mutationOptions === 'function'
        ? mutationOptions()
        : mutationOptions
    return client.defaultMutationOptions(cloneDeepUnref(resolvedOptions))
  })
  const observer = new MutationObserver(client, options.value)
  const state = options.value.shallow
    ? shallowReactive(observer.getCurrentResult())
    : reactive(observer.getCurrentResult())

  const unsubscribe = observer.subscribe((result) => {
    updateState(state, result)
  })

  const mutate = (
    ...args: Parameters<
      MutateFunction<TData, TError, TVariables, TOnMutateResult>
    >
  ) => {
    observer.mutate(args[0] as TVariables, args[1]).catch(() => {
      // This is intentional
    })
  }

  watch(options, () => {
    observer.setOptions(options.value)
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  const readonlyState = options.value.shallow
    ? shallowReadonly(state)
    : readonly(state)

  const resultRefs = toRefs(readonlyState) as ToRefs<
    Readonly<MutationResult<TData, TError, TVariables, TOnMutateResult>>
  >

  watch(
    () => state.error,
    (error) => {
      if (
        error &&
        shouldThrowError(options.value.throwOnError, [error as TError])
      ) {
        throw error
      }
    },
  )

  return {
    ...resultRefs,
    mutate,
    mutateAsync: state.mutate,
    reset: state.reset,
  }
}
