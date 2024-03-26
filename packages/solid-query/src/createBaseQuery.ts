// Had to disable the lint rule because isServer type is defined as false
// in solid-js/web package. I'll create a GitHub issue with them to see
// why that happens.
import { hydrate, notifyManager } from '@tanstack/query-core'
import { isServer } from 'solid-js/web'
import {
  createComputed,
  createMemo,
  createResource,
  createSignal,
  on,
  onCleanup,
} from 'solid-js'
import { createStore, reconcile, unwrap } from 'solid-js/store'
import { useQueryClient } from './QueryClientProvider'
import { shouldThrowError } from './utils'
import { useIsRestoring } from './isRestoring'
import type { CreateBaseQueryOptions } from './types'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'
import type {
  InfiniteQueryObserverResult,
  Query,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
  QueryState,
} from '@tanstack/query-core'

function reconcileFn<TData, TError>(
  store: QueryObserverResult<TData, TError>,
  result: QueryObserverResult<TData, TError>,
  reconcileOption:
    | string
    | false
    | ((oldData: TData | undefined, newData: TData) => TData),
): QueryObserverResult<TData, TError> {
  if (reconcileOption === false) return result
  if (typeof reconcileOption === 'function') {
    const newData = reconcileOption(store.data, result.data as TData)
    return { ...result, data: newData } as typeof result
  }
  const newData = reconcile(result.data, { key: reconcileOption })(store.data)
  return { ...result, data: newData } as typeof result
}

type HydratableQueryState<TData, TError> = QueryObserverResult<TData, TError> &
  QueryState<TData, TError> &
  InfiniteQueryObserverResult<TData, TError>

/**
 * Solid's `onHydrated` functionality will silently "fail" (hydrate with an empty object)
 * if the resource data is not serializable.
 */
const hydratableObserverResult = <
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TDataHydratable,
>(
  query: Query<TQueryFnData, TError, TData, TQueryKey>,
  result: QueryObserverResult<TDataHydratable, TError>,
) => {
  // Including the extra properties is only relevant on the server
  if (!isServer) return result as HydratableQueryState<TDataHydratable, TError>

  return {
    ...unwrap(result),

    // cast to refetch function should be safe, since we only remove it on the server,
    // and refetch is not relevant on the server
    refetch: undefined as unknown as HydratableQueryState<
      TDataHydratable,
      TError
    >['refetch'],

    // cast to fetchNextPage function should be safe, since we only remove it on the server,
    fetchNextPage: undefined as unknown as HydratableQueryState<
      TDataHydratable,
      TError
    >['fetchNextPage'],

    // cast to fetchPreviousPage function should be safe, since we only remove it on the server,
    fetchPreviousPage: undefined as unknown as HydratableQueryState<
      TDataHydratable,
      TError
    >['fetchPreviousPage'],

    // hydrate() expects a QueryState object, which is similar but not
    // quite the same as a QueryObserverResult object. Thus, for now, we're
    // copying over the missing properties from state in order to support hydration
    dataUpdateCount: query.state.dataUpdateCount,
    fetchFailureCount: query.state.fetchFailureCount,
    isInvalidated: query.state.isInvalidated,

    // Unsetting these properties on the server since they might not be serializable
    fetchFailureReason: null,
    fetchMeta: null,
  } as HydratableQueryState<TDataHydratable, TError>
}

// Base Query Function that is used to create the query.
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: Accessor<
    CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  Observer: typeof QueryObserver,
  queryClient?: Accessor<QueryClient>,
) {
  type ResourceData =
    | HydratableQueryState<TData, TError>
    | QueryObserverResult<TData, TError>

  const client = createMemo(() => useQueryClient(queryClient?.()))
  const isRestoring = useIsRestoring()
  // There are times when we run a query on the server but the resource is never read
  // This could lead to times when the queryObserver is unsubscribed before the resource has loaded
  // Causing a time out error. To prevent this we will queue the unsubscribe if the cleanup is called
  // before the resource has loaded
  let unsubscribeQueued = false

  const defaultedOptions = createMemo(() => {
    const defaultOptions = client().defaultQueryOptions(options())
    defaultOptions._optimisticResults = isRestoring()
      ? 'isRestoring'
      : 'optimistic'
    defaultOptions.structuralSharing = false
    if (isServer) {
      defaultOptions.retry = false
      defaultOptions.throwOnError = true
    }
    return defaultOptions
  })
  const initialOptions = defaultedOptions()

  const [observer, setObserver] = createSignal(
    new Observer(client(), defaultedOptions()),
  )

  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    observer().getOptimisticResult(defaultedOptions()),
  )

  const createServerSubscriber = (
    resolve: (
      data: ResourceData | PromiseLike<ResourceData | undefined> | undefined,
    ) => void,
    reject: (reason?: any) => void,
  ) => {
    return observer().subscribe((result) => {
      notifyManager.batchCalls(() => {
        const query = observer().getCurrentQuery()
        const unwrappedResult = hydratableObserverResult(query, result)

        if (unwrappedResult.isError) {
          reject(unwrappedResult.error)
          unsubscribeIfQueued()
        } else {
          resolve(unwrappedResult)
          unsubscribeIfQueued()
        }
      })()
    })
  }

  const unsubscribeIfQueued = () => {
    if (unsubscribeQueued) {
      unsubscribe?.()
      unsubscribeQueued = false
    }
  }

  const createClientSubscriber = () => {
    const obs = observer()
    return obs.subscribe((result) => {
      notifyManager.batchCalls(() => {
        // @ts-expect-error - This will error because the reconcile option does not
        // exist on the query-core QueryObserverResult type
        const reconcileOptions = obs.options.reconcile

        // If the query has data we don't suspend but instead mutate the resource
        // This could happen when placeholderData/initialData is defined
        if (queryResource()?.data && result.data && !queryResource.loading) {
          setState((store) => {
            return reconcileFn(
              store,
              result,
              reconcileOptions === undefined ? false : reconcileOptions,
            )
          })
          mutate(state)
        } else {
          setState((store) => {
            return reconcileFn(
              store,
              result,
              reconcileOptions === undefined ? false : reconcileOptions,
            )
          })
          refetch()
        }
      })()
    })
  }

  /**
   * Unsubscribe is set lazily, so that we can subscribe after hydration when needed.
   */
  let unsubscribe: (() => void) | null = null

  const [queryResource, { refetch, mutate }] = createResource<
    ResourceData | undefined
  >(
    () => {
      const obs = observer()
      return new Promise((resolve, reject) => {
        if (isServer) {
          unsubscribe = createServerSubscriber(resolve, reject)
        } else if (!unsubscribe && !isRestoring()) {
          unsubscribe = createClientSubscriber()
        }
        obs.updateResult()

        if (!state.isLoading) {
          const query = obs.getCurrentQuery()
          resolve(hydratableObserverResult(query, state))
        }
      })
    },
    {
      initialValue: state,

      // If initialData is provided, we resolve the resource immediately
      get ssrLoadFrom() {
        return options().initialData ? 'initial' : 'server'
      },

      get deferStream() {
        return options().deferStream
      },

      /**
       * If this resource was populated on the server (either sync render, or streamed in over time), onHydrated
       * will be called. This is the point at which we can hydrate the query cache state, and setup the query subscriber.
       *
       * Leveraging onHydrated allows us to plug into the async and streaming support that solidjs resources already support.
       *
       * Note that this is only invoked on the client, for queries that were originally run on the server.
       */
      onHydrated(_k, info) {
        if (info.value) {
          hydrate(client(), {
            queries: [
              {
                queryKey: initialOptions.queryKey,
                queryHash: initialOptions.queryHash,
                state: info.value,
              },
            ],
          })
        }

        if (unsubscribe) return
        /**
         * Do not refetch query on mount if query was fetched on server,
         * even if `staleTime` is not set.
         */
        const newOptions = { ...initialOptions }
        if (initialOptions.staleTime || !initialOptions.initialData) {
          newOptions.refetchOnMount = false
        }
        // Setting the options as an immutable object to prevent
        // wonky behavior with observer subscriptions
        observer().setOptions(newOptions)
        setState(observer().getOptimisticResult(newOptions))
        unsubscribe = createClientSubscriber()
      },
    },
  )

  createComputed(
    on(
      client,
      (c) => {
        if (unsubscribe) {
          unsubscribe()
        }
        const newObserver = new Observer(c, defaultedOptions())
        unsubscribe = createClientSubscriber()
        setObserver(newObserver)
      },
      {
        defer: true,
      },
    ),
  )

  createComputed(
    on(
      isRestoring,
      (restoring) => {
        if (!restoring && !isServer) {
          refetch()
        }
      },
      { defer: true },
    ),
  )

  onCleanup(() => {
    if (isServer && queryResource.loading) {
      unsubscribeQueued = true
      return
    }
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })

  createComputed(
    on(
      [observer, defaultedOptions],
      ([obs, opts]) => {
        obs.setOptions(opts)
        setState(obs.getOptimisticResult(opts))
      },
      { defer: true },
    ),
  )

  createComputed(
    on(
      () => state.status,
      () => {
        const obs = observer()
        if (
          state.isError &&
          !state.isFetching &&
          !isRestoring() &&
          shouldThrowError(obs.options.throwOnError, [
            state.error,
            obs.getCurrentQuery(),
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
      const val = queryResource()?.[prop]
      return val !== undefined ? val : Reflect.get(target, prop)
    },
  }

  return new Proxy(state, handler)
}
