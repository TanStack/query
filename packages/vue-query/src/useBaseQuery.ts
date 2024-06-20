import {
  computed,
  getCurrentScope,
  onScopeDispose,
  reactive,
  readonly,
  toRefs,
  watch,
} from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref, shouldThrowError, updateState } from './utils'
import type { Ref } from 'vue-demi'
import type {
  DefaultedQueryObserverOptions,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { UseQueryOptions } from './useQuery'
import type { UseInfiniteQueryOptions } from './useInfiniteQuery'

export type UseBaseQueryReturnType<
  TData,
  TError,
  TResult = QueryObserverResult<TData, TError>,
> = {
  [K in keyof TResult]: K extends
    | 'fetchNextPage'
    | 'fetchPreviousPage'
    | 'refetch'
    ? TResult[K]
    : Ref<Readonly<TResult>[K]>
} & {
  suspense: () => Promise<TResult>
}

type UseQueryOptionsGeneric<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> =
  | UseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  | UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >

export function useBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
  TPageParam,
>(
  Observer: typeof QueryObserver,
  options: UseQueryOptionsGeneric<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseBaseQueryReturnType<TData, TError> {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()

  const defaultedOptions = computed(() => {
    const clonedOptions = cloneDeepUnref(options as any)

    if (typeof clonedOptions.enabled === 'function') {
      clonedOptions.enabled = clonedOptions.enabled()
    }

    const defaulted: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    > = client.defaultQueryOptions(clonedOptions)

    defaulted._optimisticResults = client.isRestoring.value
      ? 'isRestoring'
      : 'optimistic'

    return defaulted
  })

  const observer = new Observer(client, defaultedOptions.value)
  const state = reactive(observer.getCurrentResult())

  let unsubscribe = () => {
    // noop
  }

  watch(
    client.isRestoring,
    (isRestoring) => {
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
  const refetch = (...args: Parameters<(typeof state)['refetch']>) => {
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
            // fix #6133
            observer.setOptions(defaultedOptions.value)
            const optimisticResult = observer.getOptimisticResult(
              defaultedOptions.value,
            )
            if (optimisticResult.isStale) {
              stopWatch()
              observer
                .fetchOptimistic(defaultedOptions.value)
                .then(resolve, (error: TError) => {
                  if (
                    shouldThrowError(defaultedOptions.value.throwOnError, [
                      error,
                      observer.getCurrentQuery(),
                    ])
                  ) {
                    reject(error)
                  } else {
                    resolve(observer.getCurrentResult())
                  }
                })
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
        shouldThrowError(defaultedOptions.value.throwOnError, [
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

  return object as UseBaseQueryReturnType<TData, TError>
}
