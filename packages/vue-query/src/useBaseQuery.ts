import {
  onScopeDispose,
  toRefs,
  readonly,
  reactive,
  watch,
  ref,
  computed,
} from 'vue-demi'
import type { ToRefs } from 'vue-demi'
import type {
  QueryObserver,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { updateState, cloneDeepUnref } from './utils'
import type { QueryClient } from './queryClient'
import type { UseQueryOptions } from './useQuery'
import type { UseInfiniteQueryOptions } from './useInfiniteQuery'

export type UseBaseQueryReturnType<
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
  const client = queryClient || useQueryClient()

  const defaultedOptions = computed(() => {
    const defaulted = client.defaultQueryOptions(cloneDeepUnref(options as any))

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
            resolve(observer.fetchOptimistic(defaultedOptions.value) as any)
          } else {
            stopWatch()
            resolve(optimisticResult as any)
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
