import { QueryObserver } from '@tanstack/query-core'
import type { QueryKey, QueryObserverResult } from '@tanstack/query-core'
import { CreateBaseQueryOptions } from './types'
import { useQueryClient } from './QueryClientProvider'
import {
  onMount,
  onCleanup,
  createComputed,
  createResource,
  createMemo,
  createEffect,
  on,
  batch,
} from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { shouldThrowError } from './utils'

// Base Query Function that is used to create the query.
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
): QueryObserverResult<TData, TError> {
  const queryClient = useQueryClient({ context: options.context });
  const errorResetBoundary = useQueryErrorResetBoundary()

  const defaultedOptions = createMemo(() => {
    const computedOptions = queryClient.defaultQueryOptions(options)
    computedOptions._optimisticResults = 'optimistic'
    if (computedOptions.suspense) {
      // Always set stale time when using suspense to prevent
      // fetching again when directly mounting after suspending
      if (typeof computedOptions.staleTime !== 'number') {
        computedOptions.staleTime = 1000
      }
    }

    if (computedOptions.suspense || computedOptions.useErrorBoundary) {
      // Prevent retrying failed query if the error boundary has not been reset yet
      if (!errorResetBoundary.isReset()) {
        computedOptions.retryOnMount = false
      }
    }
    return computedOptions
  })

  const observer = new Observer(queryClient, defaultedOptions());

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    // @ts-ignore
    observer.getOptimisticResult(defaultedOptions()),
  );

  const [dataResource, { refetch, mutate }] = createResource<TData | undefined>(
    () => {
      return new Promise((resolve) => {
        if (!(state.isFetching && state.isLoading)) {
          resolve(unwrap(state.data))
        }
      })
    },
  )

  batch(() => {
    mutate(() => unwrap(state.data))
    refetch()
  })

  const unsubscribe = observer.subscribe((result) => {
    batch(() => {
      setState(unwrap(result))
      mutate(() => unwrap(result.data))
      refetch()
    })
  })

  onCleanup(() => unsubscribe())

  onMount(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions(), { listeners: false })
  })

  // Do not update observer options on mount because it is already set.
  createComputed(
    on(
      defaultedOptions,
      () => {
        observer.setOptions(defaultedOptions())
      },
      { defer: true },
    ),
  )

  createEffect(() => {
    if (errorResetBoundary.isReset()) {
      errorResetBoundary.clearReset()
    }
  })

  createComputed(
    on(
      () => state.status,
      () => {
        if (
          state.isError &&
          !state.isFetching &&
          shouldThrowError(observer.options.useErrorBoundary, [
            state.error,
            observer.getCurrentQuery(),
          ])
        ) {
          throw state.error
        }
      },
    ),
  )

  const handler = {
    get(
      target: QueryObserverResult<TData, TError>,
      prop: keyof QueryObserverResult<TData, TError>,
    ): any {
      if (prop === 'data') {
        // handle suspense
        const isSuspense =
          defaultedOptions().suspense && state.isLoading && state.isFetching

        // handle error boundary
        const isErrorBoundary =
          state.isError &&
          !errorResetBoundary.isReset() &&
          !state.isFetching &&
          shouldThrowError(defaultedOptions().useErrorBoundary, [
            state.error,
            observer.getCurrentQuery(),
          ])

        if (isSuspense || isErrorBoundary) {
          return dataResource()
        }
        return state.data
      }
      return Reflect.get(target, prop)
    },
  }

  const proxyResult = new Proxy(state, handler) as QueryObserverResult<
    TData,
    TError
  >

  return !defaultedOptions().notifyOnChangeProps
    ? observer.trackResult(proxyResult)
    : proxyResult
}
