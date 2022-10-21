import {
  onScopeDispose,
  reactive,
  readonly,
  toRefs,
  watch,
  computed,
  isRef
} from 'vue-demi'
import type { ToRefs } from 'vue-demi'
import type {
  MutateOptions,
  MutationFunction,
  MutationKey,
  MutateFunction,
  MutationObserverResult,
  MutationObserverOptions
} from '@tanstack/query-core'
import type {
  VueMutationObserverOptions,
  WithQueryClientKey,
  MaybeRef
} from './types'
import { MutationObserver } from '@tanstack/query-core'
import { cloneDeepUnref, updateState, isMutationKey } from './utils'
import { useQueryClient } from './useQueryClient'

type MutationResult<TData, TError, TVariables, TContext> = Omit<
  MutationObserverResult<TData, TError, TVariables, TContext>,
  'mutate' | 'reset'
>

export type UseMutationOptions<TData, TError, TVariables, TContext> =
  WithQueryClientKey<
    VueMutationObserverOptions<TData, TError, TVariables, TContext>
  >

type MutateSyncFunction<
  TData = unknown,
  TError = unknown,
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
  Result = MutationResult<TData, TError, TVariables, TContext>,
> = ToRefs<Readonly<Result>> & {
  mutate: MutateSyncFunction<TData, TError, TVariables, TContext>
  mutateAsync: MutateFunction<TData, TError, TVariables, TContext>
  reset: MutationObserverResult<TData, TError, TVariables, TContext>['reset']
}

export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationReturnType<TData, TError, TVariables, TContext>
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: MaybeRef<MutationFunction<TData, TVariables>>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  >,
): UseMutationReturnType<TData, TError, TVariables, TContext>
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationKey: MaybeRef<MutationKey>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey'
  >,
): UseMutationReturnType<TData, TError, TVariables, TContext>
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationKey: MaybeRef<MutationKey>,
  mutationFn?: MaybeRef<MutationFunction<TData, TVariables>>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey' | 'mutationFn'
  >,
): UseMutationReturnType<TData, TError, TVariables, TContext>
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  arg1:
    | MaybeRef<MutationKey>
    | MaybeRef<MutationFunction<TData, TVariables>>
    | UseMutationOptions<TData, TError, TVariables, TContext>,
  arg2?:
    | MaybeRef<MutationFunction<TData, TVariables>>
    | UseMutationOptions<TData, TError, TVariables, TContext>,
  arg3?: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationReturnType<TData, TError, TVariables, TContext> {
  const options = computed(() => {
    return parseMutationArgs(arg1, arg2, arg3)
  })
  
  const queryClient = options.value.queryClient ?? useQueryClient(options.value.queryClientKey)
  const observer = new MutationObserver(queryClient, queryClient.defaultMutationOptions(options.value))
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

  watch(options,
    () => {
      observer.setOptions(
        queryClient.defaultMutationOptions(queryClient.defaultMutationOptions(options.value)),
      )
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  const resultRefs = toRefs(readonly(state)) as unknown as ToRefs<
    Readonly<MutationResult<TData, TError, TVariables, TContext>>
  >

  return {
    ...resultRefs,
    mutate,
    mutateAsync: state.mutate,
    reset: state.reset,
  }
}

export function parseMutationArgs<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  arg1:
    | MaybeRef<MutationKey>
    | MaybeRef<MutationFunction<TData, TVariables>>
    | UseMutationOptions<TData, TError, TVariables, TContext>,
  arg2?:
    | MaybeRef<MutationFunction<TData, TVariables>>
    | UseMutationOptions<TData, TError, TVariables, TContext>,
  arg3?: UseMutationOptions<TData, TError, TVariables, TContext>,
): WithQueryClientKey<MutationObserverOptions<TData, TError, TVariables, TContext>> {
  let options = arg1
  if (isMutationKey(arg1)) {
    const plainFn = isRef(arg2) ? arg2.value : arg2
    if (typeof plainFn === 'function') {
      options = { ...arg3, mutationKey: arg1, mutationFn: plainFn }
    } else {
      options = { ...arg2, mutationKey: arg1 }
    }
  }

  const plainFn = isRef(arg1) ? arg1.value : arg1
  if (typeof plainFn === 'function') {
    options = { ...arg2, mutationFn: plainFn }
  }

  return cloneDeepUnref(options) as WithQueryClientKey<MutationObserverOptions<
    TData,
    TError,
    TVariables,
    TContext
  >>
}
