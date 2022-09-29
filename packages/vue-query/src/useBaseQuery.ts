import { onScopeDispose, toRefs, readonly, reactive, watch } from 'vue-demi'
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
import type { WithQueryClientKey } from './types'
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
  TQueryData,
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
  const options = getQueryUnreffedOptions()
  const queryClient =
    options.queryClient ?? useQueryClient(options.queryClientKey)
  const defaultedOptions = queryClient.defaultQueryOptions(options)
  const observer = new Observer(queryClient, defaultedOptions)
  const state = reactive(observer.getCurrentResult())
  const unsubscribe = observer.subscribe((result) => {
    updateState(state, result)
  })

  watch(
    [() => arg1, () => arg2, () => arg3],
    () => {
      observer.setOptions(
        queryClient.defaultQueryOptions(getQueryUnreffedOptions()),
      )
    },
    { deep: true },
  )

  onScopeDispose(() => {
    unsubscribe()
  })

  const suspense = () => {
    return new Promise<QueryObserverResult<TData, TError>>((resolve) => {
      const run = () => {
        const newOptions = queryClient.defaultQueryOptions(
          getQueryUnreffedOptions(),
        )
        if (newOptions.enabled !== false) {
          const optimisticResult = observer.getOptimisticResult(newOptions)
          if (optimisticResult.isStale) {
            resolve(observer.fetchOptimistic(defaultedOptions))
          } else {
            resolve(optimisticResult)
          }
        }
      }

      run()

      watch([() => arg1, () => arg2, () => arg3], run, { deep: true })
    })
  }

  return {
    ...(toRefs(readonly(state)) as UseQueryReturnType<TData, TError>),
    suspense,
  }

  /**
   * Get Query Options object
   * All inner refs unwrapped. No Reactivity
   */
  function getQueryUnreffedOptions() {
    let mergedOptions

    if (!isQueryKey(arg1)) {
      // `useQuery(optionsObj)`
      mergedOptions = arg1
    } else if (typeof arg2 === 'function') {
      // `useQuery(queryKey, queryFn, optionsObj?)`
      mergedOptions = { ...arg3, queryKey: arg1, queryFn: arg2 }
    } else {
      // `useQuery(queryKey, optionsObj?)`
      mergedOptions = { ...arg2, queryKey: arg1 }
    }

    return cloneDeepUnref(mergedOptions) as WithQueryClientKey<
      QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    >
  }
}
