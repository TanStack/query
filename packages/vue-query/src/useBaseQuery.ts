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
import type { ToRef } from 'vue-demi'
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
> = {
  [K in keyof Result]: K extends
    | 'fetchNextPage'
    | 'fetchPreviousPage'
    | 'refetch'
    | 'remove'
    ? Result[K]
    : ToRef<Readonly<Result>[K]>
} & {
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
        'vue-query composables like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
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

  const updater = () => {
    observer.setOptions(defaultedOptions.value)
    updateState(state, observer.getCurrentResult())
  }

  watch(defaultedOptions, updater)

  onScopeDispose(() => {
    unsubscribe()
  })

  // fix #5910
  const refetch = (...args: Parameters<typeof state['refetch']>) => {
    updater()
    return state.refetch(...args)
  }

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

  const object: any = toRefs(readonly(state))
  for (const key in state) {
    if (typeof state[key as keyof typeof state] === 'function') {
      object[key] = state[key as keyof typeof state]
    }
  }

  object.suspense = suspense
  object.refetch = refetch

  return object as UseQueryReturnType<TData, TError>
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

  const clondedOptions = cloneDeepUnref(options)

  if (typeof clondedOptions.enabled === 'function') {
    clondedOptions.enabled = clondedOptions.enabled()
  }

  return clondedOptions as WithQueryClientKey<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >
}
