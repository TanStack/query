import {
  computed,
  onScopeDispose,
  reactive,
  readonly,
  toRefs,
  watch,
} from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref, updateState } from './utils'
import type { ToRefs } from 'vue-demi'
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
    const defaulted: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    > = client.defaultQueryOptions(cloneDeepUnref(options as any))

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
    { deep: true },
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

  return {
    ...(toRefs(readonly(state)) as ToRefs<
      Readonly<QueryObserverResult<TData, TError>>
    >),
    suspense,
  }
}
