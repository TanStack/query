import {
  computed,
  getCurrentScope,
  onScopeDispose,
  reactive,
  readonly,
  toRefs,
  unref,
  watch,
} from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import {
  cloneDeepUnref,
  isQueryKey,
  shouldThrowError,
  updateState,
} from './utils'
import type { ToRefs } from 'vue-demi'
import type {
  QueryFunction,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { DeepUnwrapRef, MaybeRef, WithQueryClientKey } from './types'
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
    | MaybeRef<TQueryKey>
    | MaybeRef<UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>>,
  arg2:
    | MaybeRef<QueryFunction<TQueryFnData, DeepUnwrapRef<TQueryKey>>>
    | MaybeRef<
        UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
      > = {},
  arg3: MaybeRef<
    UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
  > = {},
): UseQueryReturnType<TData, TError> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composables like "uesQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

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

  let unsubscribe = () => {
    // noop
  }

  watch(
    queryClient.isRestoring,
    (isRestoring) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!isRestoring) {
        unsubscribe()
        unsubscribe = observer.subscribe((result) => {
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
    { flush: 'sync' },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  const suspense = () => {
    return new Promise<QueryObserverResult<TData, TError>>(
      (resolve, reject) => {
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
              observer
                .fetchOptimistic(defaultedOptions.value)
                .then(resolve, reject)
            } else {
              stopWatch()
              resolve(optimisticResult)
            }
          }
        }

        run()

        stopWatch = watch(defaultedOptions, run, { deep: true })
      },
    )
  }

  // Handle error boundary
  watch(
    () => state.error,
    (error) => {
      if (
        state.isError &&
        !state.isFetching &&
        shouldThrowError(defaultedOptions.value.useErrorBoundary, [
          error as TError,
          observer.getCurrentQuery(),
        ])
      ) {
        throw error
      }
    },
  )

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
    | MaybeRef<QueryFunction<TQueryFnData, DeepUnwrapRef<TQueryKey>>>
    | MaybeRef<
        UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
      > = {},
  arg3: MaybeRef<
    UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
  > = {},
): WithQueryClientKey<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
> {
  const plainArg1 = unref(arg1)
  const plainArg2 = unref(arg2)
  const plainArg3 = unref(arg3)

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
