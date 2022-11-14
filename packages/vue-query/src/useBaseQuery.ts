import {
  onScopeDispose,
  toRefs,
  readonly,
  reactive,
  watch,
  ref,
  computed,
  isRef,
} from 'vue-demi'
import type { ToRefs, UnwrapRef } from 'vue-demi'
import type {
  QueryObserver,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  QueryFunction,
} from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { updateState, isQueryKey, cloneDeepUnref } from './utils'
import type { MaybeRef, WithQueryClientKey } from './types'
import type { UseQueryOptions } from './useQuery'
import type { UseInfiniteQueryOptions } from './useInfiniteQuery'

export type UseQueryReturnType<
  TData,
  TError,
  Result = QueryObserverResult<TData, TError>,
> = ToRefs<Readonly<Result>> & {
  suspense: () => Promise<Result>
}

type UseQueryOptionsGeneric<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  | UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>

export function useBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(
  Observer: typeof QueryObserver,
  arg1:
    | TQueryKey
    | UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>,
  arg2:
    | QueryFunction<TQueryFnData, UnwrapRef<TQueryKey>>
    | UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey> = {},
  arg3: UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey> = {},
): UseQueryReturnType<TData, TError> {
  const options = computed(() => parseQueryArgs(arg1, arg2, arg3))

  const queryClient =
    options.value.queryClient ?? useQueryClient(options.value.queryClientKey)

  const defaultedOptions = computed(() => {
    const defaulted = queryClient.defaultQueryOptions(options.value)
    defaulted._optimisticResults = queryClient.isRestoring.value
      ? 'isRestoring'
      : 'optimistic'

    return defaulted
  })

  const observer = new Observer(queryClient, defaultedOptions.value)
  const state = reactive(observer.getCurrentResult())

  const unsubscribe = ref(() => {
    // noop
  })

  watch(
    queryClient.isRestoring,
    (isRestoring) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!isRestoring) {
        unsubscribe.value()
        unsubscribe.value = observer.subscribe((result) => {
          updateState(state, result)
        })
      }
    },
    { immediate: true },
  )

  watch(
    defaultedOptions,
    () => {
      observer.setOptions(defaultedOptions.value)
      updateState(state, observer.getCurrentResult())
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe.value()
  })

  const suspense = () => {
    return new Promise<QueryObserverResult<TData, TError>>((resolve) => {
      let stopWatch = () => {
        //noop
      }
      const run = () => {
        if (defaultedOptions.value.enabled !== false) {
          const optimisticResult = observer.getOptimisticResult(
            defaultedOptions.value,
          )
          if (optimisticResult.isStale) {
            stopWatch()
            resolve(observer.fetchOptimistic(defaultedOptions.value))
          } else {
            stopWatch()
            resolve(optimisticResult)
          }
        }
      }

      run()

      stopWatch = watch(defaultedOptions, run, { deep: true })
    })
  }

  return {
    ...(toRefs(readonly(state)) as UseQueryReturnType<TData, TError>),
    suspense,
  }
}

export function parseQueryArgs<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  arg1:
    | MaybeRef<TQueryKey>
    | MaybeRef<UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>>,
  arg2:
    | MaybeRef<QueryFunction<TQueryFnData, UnwrapRef<TQueryKey>>>
    | MaybeRef<
        UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
      > = {},
  arg3: MaybeRef<
    UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
  > = {},
): WithQueryClientKey<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
> {
  const plainArg1 = isRef(arg1) ? arg1.value : arg1
  const plainArg2 = isRef(arg2) ? arg2.value : arg2
  const plainArg3 = isRef(arg3) ? arg3.value : arg3

  let options = plainArg1

  if (!isQueryKey(plainArg1)) {
    options = plainArg1
  } else if (typeof plainArg2 === 'function') {
    options = { ...plainArg3, queryKey: plainArg1, queryFn: plainArg2 }
  } else {
    options = { ...plainArg2, queryKey: plainArg1 }
  }

  return cloneDeepUnref(options) as WithQueryClientKey<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >
}
