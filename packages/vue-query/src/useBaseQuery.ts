import {
  onScopeDispose,
  toRefs,
  readonly,
  reactive,
  watch,
  ref,
  computed,
  unref,
} from 'vue-demi'
import type { ToRefs } from 'vue-demi'
import type {
  QueryObserver,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { updateState, cloneDeepUnref } from './utils'
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
  genericOptions: UseQueryOptionsGeneric<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): UseQueryReturnType<TData, TError> {
  const options = computed(() => parseQueryArgs(genericOptions))

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
  arg1: MaybeRef<
    UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
  >,
): WithQueryClientKey<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
> {
  const options = unref(arg1)

  return cloneDeepUnref(options) as WithQueryClientKey<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >
}
