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
    defaulted._isRestoring = queryClient.isRestoring.value
    return defaulted
  })

  const observer = new Observer(queryClient, defaultedOptions.value)

  const state = reactive(observer.getCurrentResult())

  watch(
    defaultedOptions,
    () => {
      observer.setOptions(defaultedOptions.value, { listeners: false })
      updateState(state, observer.getCurrentResult())
    },
    { flush: 'sync', immediate: true },
  )

  const unsubscribe = observer.subscribe((result) => {
    updateState(state, result)
  })

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
            const result = observer.getCurrentResult()
            if (result.isStale) {
              stopWatch()
              observer.refetch().then(resolve, reject)
            } else {
              stopWatch()
              resolve(result)
            }
          }
        }

        run()

        stopWatch = watch(defaultedOptions, run)
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
