import {
  computed,
  getCurrentScope,
  onScopeDispose,
  reactive,
  readonly,
  shallowReactive,
  shallowReadonly,
  toRefs,
  watch,
} from 'vue-demi'
import { shouldThrowError } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref, updateState } from './utils'
import type { Ref } from 'vue-demi'
import type {
  DefaultedQueryObserverOptions,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { UseQueryOptions } from './queryOptions'
import type { UseInfiniteQueryOptions } from './useInfiniteQuery'
import type { MaybeRefOrGetter } from './types'

/**
 * Action methods stay on the composable return (`refetch`, `fetchNextPage`, `fetchPreviousPage`).
 * They are not part of the `status` discriminant, so `state` omits them.
 */
type QueryStateFunctionKey = 'refetch' | 'fetchNextPage' | 'fetchPreviousPage'

/**
 * Readonly view of a union that stays a union. A single `Readonly<Union>` collapses the members, which
 * drops the `status` / `isSuccess` / `isPending` discriminants.
 */
type ReadonlyQueryState<T> = T extends any
  ? {
      readonly [
        K in keyof T as K extends QueryStateFunctionKey ? never : K
      ]: T[K]
    }
  : never

/**
 * The result of the query composables: every property of the observer result wrapped in a `Ref`, except
 * the `refetch`, `fetchNextPage`, and `fetchPreviousPage` functions, plus `suspense` and `state`.
 */
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
  /**
   * Returns a promise for use with Vue's `Suspense` or `onServerPrefetch`. It fetches the query if it has no
   * data or its data is stale and resolves with the result once that fetch resolves (usually when the query
   * function finishes, but earlier after the first chunk of a streamed query or when data is set during the
   * fetch), or resolves immediately if the data is fresh. While the query is disabled, it waits until the query
   * is enabled. If the fetch fails, it resolves with the error result, unless `throwOnError` is (or returns)
   * `true`, in which case it rejects.
   */
  suspense: () => Promise<TResult>
  /**
   * The query result as one readonly reactive object. `data`, `error`, `status`, `isPending`, and the other
   * status fields are plain values — read `state.data`, not `state.data.value`. `refetch`, `fetchNextPage`,
   * and `fetchPreviousPage` stay on the composable return, next to `state`.
   *
   * The object is a discriminated union, so a check on `status`, `isSuccess`, `isPending`, or `isError`
   * narrows the other fields. When `status` is `'success'` (or `isSuccess` is `true`), `data` is `TData`.
   * When `status` is `'pending'` (or `isPending` is `true`), `data` is `undefined` and `error` is `null`.
   * @example
   * ```vue
   * <script setup lang="ts">
   * import { useQuery } from '@tanstack/vue-query'
   *
   * const { state } = useQuery({
   *   queryKey: ['post'],
   *   queryFn: fetchPost,
   * })
   *
   * if (state.status === 'success') {
   *   // `state.data` is `Post`, not `Post | undefined`
   *   console.log(state.data.title)
   * }
   * </script>
   *
   * <template>
   *   <span v-if="state.status === 'pending'">Loading...</span>
   *   <span v-else-if="state.status === 'error'">Error: {{ state.error.message }}</span>
   *   <h1 v-else>{{ state.data.title }}</h1>
   * </template>
   * ```
   */
  state: ReadonlyQueryState<TResult>
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
  | UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>

/**
 * Base implementation shared by `useQuery` and `useInfiniteQuery`.
 * @param Observer - The observer class from query-core (`QueryObserver` or `InfiniteQueryObserver`).
 * @param options - A `ref`, plain value, or reactive getter resolving to the query options.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
 * will be used.
 * @returns The query result as `ref`s, plus the `suspense` function.
 */
export function useBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
  TPageParam,
>(
  Observer: typeof QueryObserver,
  options: MaybeRefOrGetter<
    UseQueryOptionsGeneric<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >
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
    let resolvedOptions = options
    if (typeof resolvedOptions === 'function') {
      resolvedOptions = resolvedOptions()
    }
    const clonedOptions = cloneDeepUnref(resolvedOptions as any)

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

    defaulted._optimisticResults = client.isRestoring?.value
      ? 'isRestoring'
      : 'optimistic'

    return defaulted
  })

  const observer = new Observer(client, defaultedOptions.value)
  // @ts-expect-error
  const state = defaultedOptions.value.shallow
    ? shallowReactive(observer.getCurrentResult())
    : reactive(observer.getCurrentResult())

  // `updateState` only writes keys already present on `state`. Drop the action
  // methods before the first update so `state` keeps the status fields only.
  const exposedFns: Record<string, unknown> = {}
  for (const key of Object.keys(state)) {
    if (typeof state[key as keyof typeof state] === 'function') {
      exposedFns[key] = state[key as keyof typeof state]
      delete state[key as keyof typeof state]
    }
  }

  let unsubscribe = () => {
    // noop
  }

  if (client.isRestoring) {
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
  }

  const updater = () => {
    observer.setOptions(defaultedOptions.value)
    updateState(state, observer.getCurrentResult())
  }

  // fix #5910
  const refetch = (
    ...args: Parameters<QueryObserverResult<TData, TError>['refetch']>
  ) => {
    updater()
    return observer.refetch(...args)
  }

  watch(defaultedOptions, updater)

  onScopeDispose(() => {
    unsubscribe()
  })

  const suspense = () => {
    return new Promise<QueryObserverResult<TData, TError>>(
      (resolve, reject) => {
        let stopWatch = () => {
          // noop
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

  // @ts-expect-error
  const readonlyState = defaultedOptions.value.shallow
    ? shallowReadonly(state)
    : readonly(state)

  const object: any = toRefs(readonlyState)
  Object.assign(object, exposedFns)

  object.suspense = suspense
  object.refetch = refetch
  object.state = readonlyState

  return object as UseBaseQueryReturnType<TData, TError>
}
