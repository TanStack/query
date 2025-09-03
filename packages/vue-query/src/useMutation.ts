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
  MutateOptions,
  MutationObserverOptions,
  MutationObserverResult,
} from '@tanstack/query-core'
import type { MaybeRefDeep, ShallowOption } from './types'
import type { QueryClient } from './queryClient'

type MutationResult<TData, TError, TVariables, TScope> = DistributiveOmit<
  MutationObserverResult<TData, TError, TVariables, TScope>,
  'mutate' | 'reset'
>

type UseMutationOptionsBase<TData, TError, TVariables, TScope> =
  MutationObserverOptions<TData, TError, TVariables, TScope> & ShallowOption

export type UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
> = MaybeRefDeep<UseMutationOptionsBase<TData, TError, TVariables, TScope>>

type MutateSyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
> = (
  ...options: Parameters<MutateFunction<TData, TError, TVariables, TScope>>
) => void

export type UseMutationReturnType<
  TData,
  TError,
  TVariables,
  TScope,
  TResult = MutationResult<TData, TError, TVariables, TScope>,
> = ToRefs<Readonly<TResult>> & {
  mutate: MutateSyncFunction<TData, TError, TVariables, TScope>
  mutateAsync: MutateFunction<TData, TError, TVariables, TScope>
  reset: MutationObserverResult<TData, TError, TVariables, TScope>['reset']
}

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
>(
  mutationOptions: MaybeRefDeep<
    UseMutationOptionsBase<TData, TError, TVariables, TScope>
  >,
  queryClient?: QueryClient,
): UseMutationReturnType<TData, TError, TVariables, TScope> {
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
  const state = options.value.shallow
    ? shallowReactive(observer.getCurrentResult())
    : reactive(observer.getCurrentResult())

  const unsubscribe = observer.subscribe((result) => {
    updateState(state, result)
  })

  const mutate = (
    variables: TVariables,
    mutateOptions?: MutateOptions<TData, TError, TVariables, TScope>,
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

  const readonlyState = options.value.shallow
    ? shallowReadonly(state)
    : readonly(state)

  const resultRefs = toRefs(readonlyState) as ToRefs<
    Readonly<MutationResult<TData, TError, TVariables, TScope>>
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
