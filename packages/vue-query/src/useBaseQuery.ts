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
import type { MaybeRef } from './types'
import type { UseQueryOptions } from './useQuery'
import type { UseInfiniteQueryOptions } from './useInfiniteQuery'
import type { QueryClient } from './queryClient'

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
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError> {
  const options = computed(() => unrefQueryArgs(genericOptions))

  const client = queryClient || useQueryClient()

  const defaultedOptions = computed(() => {
    const defaulted = client.defaultQueryOptions(options.value)
    defaulted._optimisticResults = client.isRestoring.value
      ? 'isRestoring'
      : 'optimistic'

    return defaulted
  })

  const observer = new Observer(client, defaultedOptions.value)
  const state = reactive(observer.getCurrentResult())

  const unsubscribe = ref(() => {
    // noop
  })

  watch(
    client.isRestoring,
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
    ...(toRefs(readonly(state)) as ToRefs<
      Readonly<QueryObserverResult<TData, TError>>
    >),
    suspense,
  }
}

export function unrefQueryArgs<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  arg1: MaybeRef<
    UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
  >,
): QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {
  const options = unref(arg1)
  return cloneDeepUnref(options) as QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >
}
