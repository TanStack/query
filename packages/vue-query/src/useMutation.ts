import {
  computed,
  getCurrentScope,
  onScopeDispose,
  reactive,
  readonly,
  toRefs,
  watch,
} from 'vue-demi'
import { MutationObserver } from '@tanstack/query-core'
import { cloneDeepUnref, shouldThrowError, updateState } from './utils'
import { useQueryClient } from './useQueryClient'
import type { ToRefs } from 'vue-demi'
import type {
  DefaultError,
  MutateFunction,
  MutateOptions,
  MutationObserverOptions,
  MutationObserverResult,
} from '@tanstack/query-core'
import type { DistributiveOmit, MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'

type MutationResult<TData, TError, TVariables, TContext> = DistributiveOmit<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  'mutate' | 'reset'
>

export type UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = MaybeRefDeep<MutationObserverOptions<TData, TError, TVariables, TContext>>

type MutateSyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  ...options: Parameters<MutateFunction<TData, TError, TVariables, TContext>>
) => void

export type UseMutationReturnType<
  TData,
  TError,
  TVariables,
  TContext,
  TResult = MutationResult<TData, TError, TVariables, TContext>,
> = ToRefs<Readonly<TResult>> & {
  mutate: MutateSyncFunction<TData, TError, TVariables, TContext>
  mutateAsync: MutateFunction<TData, TError, TVariables, TContext>
  reset: MutationObserverResult<TData, TError, TVariables, TContext>['reset']
}

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  mutationOptions: MaybeRefDeep<
    MutationObserverOptions<TData, TError, TVariables, TContext>
  >,
  queryClient?: QueryClient,
): UseMutationReturnType<TData, TError, TVariables, TContext> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()
  const options = computed(() => {
    return client.defaultMutationOptions(cloneDeepUnref(mutationOptions))
  })
  const observer = new MutationObserver(client, options.value)
  const state = reactive(observer.getCurrentResult())

  const unsubscribe = observer.subscribe((result) => {
    updateState(state, result)
  })

  const mutate = (
    variables: TVariables,
    mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>,
  ) => {
    observer.mutate(variables, mutateOptions).catch(() => {
      // This is intentional
    })
  }

  watch(options, () => {
    observer.setOptions(options.value)
  })

  onScopeDispose(() => {
    unsubscribe()
  })

  const resultRefs = toRefs(readonly(state)) as unknown as ToRefs<
    Readonly<MutationResult<TData, TError, TVariables, TContext>>
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
