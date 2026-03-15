// Had to disable the lint rule because isServer type is defined as false
// in solid-js/web package. I'll create a GitHub issue with them to see
// why that happens.
import { notifyManager, shouldThrowError } from '@tanstack/query-core'
import { isServer } from '@solidjs/web'
import {
  createMemo,
  createStore,
  isPending,
  onCleanup,
  reconcile,
  refresh,
  snapshot,
} from 'solid-js'
import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './isRestoring'
import type { UseBaseQueryOptions } from './types'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'
import type {
  Query,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'

/**
 * During SSR, Solid's store is serialized by seroval which cannot handle
 * functions.  Strip `refetch`, `fetchNextPage`, and `fetchPreviousPage`
 * from the observer result before it enters the store so serialization
 * succeeds.  On the client this is a no-op (returns the object as-is).
 */
function _stripFnsForSSR<TData, TError>(
  obj: QueryObserverResult<TData, TError>,
): QueryObserverResult<TData, TError> {
  if (!isServer) return obj
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj)) {
    if (k === 'refetch' || k === 'fetchNextPage' || k === 'fetchPreviousPage') {
      out[k] = undefined
    } else {
      out[k] = (obj as any)[k]
    }
  }
  return out as unknown as QueryObserverResult<TData, TError>
}

function reconcileFn<TData, TError>(
  store: QueryObserverResult<TData, TError>,
  result: QueryObserverResult<TData, TError>,
  reconcileOption:
    | string
    | false
    | ((oldData: TData | undefined, newData: TData) => TData),
  queryHash?: string,
): QueryObserverResult<TData, TError> {
  if (typeof reconcileOption === 'function') {
    const newData = reconcileOption(store.data, result.data as TData)
    return { ...result, data: newData } as typeof result
  }

  if (reconcileOption === false) return result

  const key = reconcileOption

  let data = result.data
  if (store.data === undefined) {
    try {
      data = structuredClone(data)
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        if (error instanceof Error) {
          console.warn(
            `Unable to correctly reconcile data for query key: ${queryHash}. ` +
              `Possibly because the query data contains data structures that aren't supported ` +
              `by the 'structuredClone' algorithm. Consider using a callback function instead ` +
              `to manage the reconciliation manually.\n\n Error Received: ${error.name} - ${error.message}`,
          )
        }
      }
    }
  }
  // reconcile() in Solid 2.0 mutates in place and returns void.
  // We apply it to store.data so the store's nested signals update.
  // On first load (store.data is undefined), there's nothing to reconcile against,
  // so we just return the data as-is.
  if (store.data !== undefined && data !== undefined) {
    reconcile(data, key)(store.data)
    // Return result with the existing store.data reference (now reconciled in place)
    return { ...result, data: store.data } as typeof result
  }
  return { ...result, data } as typeof result
}

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
  if (!isServer) return result
  const obj: any = {
    ...snapshot(result),
    // During SSR, functions cannot be serialized, so we need to remove them
    // This is safe because we will add these functions back when the query is hydrated
    refetch: undefined,
  }

  // If the query is an infinite query, we need to remove additional properties
  if ('fetchNextPage' in result) {
    obj.fetchNextPage = undefined
    obj.fetchPreviousPage = undefined
  }

  // We will also attach the dehydrated state of the query to the result
  // This will be removed on client after hydration
  obj.hydrationData = {
    state: query.state,
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    ...(query.meta && { meta: query.meta }),
  }

  return obj
}

// Base Query Function that is used to create the query.
export function useBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: Accessor<
    UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  Observer: typeof QueryObserver,
  queryClient?: Accessor<QueryClient>,
) {
  type ResourceData = QueryObserverResult<TData, TError>

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
      // Enable prefetch during render for SSR - required for createResource to work
      // Without this, queries wait for effects which never run on the server
      defaultOptions.experimental_prefetchInRender = true
    }
    return defaultOptions
  })

  const observer = new Observer(client(), defaultedOptions())

  // Track options reactively; apply them with listeners disabled to avoid
  // feedback loops when option identities (e.g. inline select functions)
  // change across refresh cycles.
  const trackedDefaultedOptions = createMemo(() => defaultedOptions())

  let observerResult = observer.getOptimisticResult(defaultedOptions())
  const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
    _stripFnsForSSR(observerResult),
  )

  const createServerSubscriber = (
    resolve: (
      data: ResourceData | PromiseLike<ResourceData | undefined> | undefined,
    ) => void,
    reject: (reason?: any) => void,
  ) => {
    return observer.subscribe((result) => {
      notifyManager.batchCalls(() => {
        const query = observer.getCurrentQuery()
        const unwrappedResult = hydratableObserverResult(query, result)

        if (result.data !== undefined && unwrappedResult.isError) {
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
    return observer.subscribe((result) => {
      const previousResult = observerResult
      observerResult = result
      setStateWithReconciliation(result)
      queueMicrotask(() => {
        if (
          unsubscribe &&
          !disposed &&
          (previousResult.isLoading !== result.isLoading ||
            previousResult.isError !== result.isError)
        ) {
          try {
            refresh(queryResource)
          } catch {
            // NotReadyError is expected when refreshing a memo that returns
            // a Promise. The Loading boundary handles this during rendering,
            // but when refresh is called from a microtask there is no boundary.
          }
        }
      })
    })
  }

  function setStateWithReconciliation(res: typeof observerResult) {
    const opts = observer.options
    const reconcileOptions = (opts as any).reconcile
    const sanitized = _stripFnsForSSR(res)

    setState((store) => {
      return reconcileFn(
        store,
        sanitized,
        reconcileOptions === undefined ? false : reconcileOptions,
        opts.queryHash,
      )
    })
  }

  /**
   * Unsubscribe is set lazily, so that we can subscribe after hydration when needed.
   */
  let unsubscribe: (() => void) | null = null
  let disposed = false

  /*
    Fixes #7275
    In a few cases, the observer could unmount before the resource is loaded.
    This leads to Suspense boundaries to be suspended indefinitely.
    This resolver will be called when the observer is unmounting
    but the resource is still in a loading state
  */
  let resolver: ((value: ResourceData) => void) | null = null
  const queryResource = createMemo<ResourceData>(() => {
    // Read trackedDefaultedOptions to ensure this memo re-runs when options change
    const opts = trackedDefaultedOptions()
    observer.setOptions(opts)
    return new Promise((resolve, reject) => {
      resolver = resolve
      if (isServer) {
        unsubscribe = createServerSubscriber((data) => {
          resolve(data as ResourceData)
        }, reject)
      } else if (!unsubscribe && !isRestoring()) {
        unsubscribe = createClientSubscriber()
      }
      observer.updateResult()
      // Get the latest result after updateResult - observerResult may be stale
      // (e.g. after query key change, the observer now points to a new query)
      const currentResult = observer.getOptimisticResult(opts)
      observerResult = currentResult

      if (
        currentResult.isError &&
        !currentResult.isFetching &&
        !isRestoring() &&
        shouldThrowError(observer.options.throwOnError, [
          currentResult.error,
          observer.getCurrentQuery(),
        ])
      ) {
        setStateWithReconciliation(currentResult)
        return reject(currentResult.error)
      }
      if (!currentResult.isLoading) {
        resolver = null
        return resolve(
          hydratableObserverResult(observer.getCurrentQuery(), currentResult),
        )
      }

      setStateWithReconciliation(currentResult)
    })
  })

  // createComputed(
  //   on(
  //     client,
  //     (c) => {
  //       if (unsubscribe) {
  //         unsubscribe()
  //       }
  //       const newObserver = new Observer(c, defaultedOptions())
  //       unsubscribe = createClientSubscriber()
  //       setObserver(newObserver)
  //     },
  //     {
  //       defer: true,
  //     },
  //   ),
  // )

  // createComputed(
  //   on(
  //     isRestoring,
  //     (restoring) => {
  //       if (!restoring && !isServer) {
  //         refetch()
  //       }
  //     },
  //     { defer: true },
  //   ),
  // )

  onCleanup(() => {
    disposed = true
    if (isServer && isPending(queryResource)) {
      unsubscribeQueued = true
      return
    }
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    if (resolver && !isServer) {
      resolver(observerResult)
      resolver = null
    }
  })

  // createComputed(
  //   on(
  //     [observer, defaultedOptions],
  //     ([obs, opts]) => {
  //       obs.setOptions(opts)
  //       setStateWithReconciliation(obs.getOptimisticResult(opts))
  //       refetch()
  //     },
  //     { defer: true },
  //   ),
  // )

  // Properties that should never throw — these let users access error info
  // even outside an ErrorBoundary.
  const errorPassthroughProps = new Set([
    'error',
    'isError',
    'failureCount',
    'failureReason',
    'errorUpdateCount',
    'errorUpdatedAt',
  ])

  // Return a proxy that throws on property access when throwOnError is enabled
  return new Proxy(state, {
    get(target, prop, receiver) {
      // Always pass through symbols (needed for store internals, iteration, etc.)
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver)
      }

      // Always pass through error-related props without throwing
      if (errorPassthroughProps.has(prop)) {
        return Reflect.get(target, prop, receiver)
      }

      // Check throwOnError condition before returning the value
      if (
        state.isError &&
        !state.isFetching &&
        shouldThrowError(observer.options.throwOnError, [
          state.error,
          observer.getCurrentQuery(),
        ])
      ) {
        throw state.error
      }

      return Reflect.get(target, prop, receiver)
    },
  })
}
