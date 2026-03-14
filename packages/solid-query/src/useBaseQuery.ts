// Had to disable the lint rule because isServer type is defined as false
// in solid-js/web package. I'll create a GitHub issue with them to see
// why that happens.
import { notifyManager, shouldThrowError } from '@tanstack/query-core'
import { isServer } from '@solidjs/web'
import {
  createMemo,
  createStore,
  isPending,
  latest,
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

function reconcileFn<TData, TError>(
  store: QueryObserverResult<TData, TError>,
  result: QueryObserverResult<TData, TError>,
  reconcileOption:
    | string
    | false
    | ((oldData: TData | undefined, newData: TData) => TData),
  queryHash?: string,
): QueryObserverResult<TData, TError> {
  if (reconcileOption === false) return result
  if (typeof reconcileOption === 'function') {
    const newData = reconcileOption(store.data, result.data as TData)
    return { ...result, data: newData } as typeof result
  }
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
  const newData = reconcile(data, reconcileOption)(store.data)
  return { ...result, data: newData } as typeof result
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

  const observer = createMemo(() =>
    new Observer(client(), defaultedOptions()),
  )

  let observerResult = observer().getOptimisticResult(defaultedOptions())
  const [state, setState] =
    createStore<QueryObserverResult<TData, TError>>(observerResult)

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
    const obs = observer()
    return obs.subscribe((result) => {
      observerResult = result
      queueMicrotask(() => {
        if (unsubscribe) {
          refresh(queryResource)
        }
      })
    })
  }

  function setStateWithReconciliation(res: typeof observerResult) {
    const opts = observer().options
    // @ts-expect-error - Reconcile option is not correctly typed internally
    const reconcileOptions = opts.reconcile

    setState((store) => {
      return reconcileFn(
        store,
        res,
        reconcileOptions === undefined ? false : reconcileOptions,
        opts.queryHash,
      )
    })
  }

  /**
   * Unsubscribe is set lazily, so that we can subscribe after hydration when needed.
   */
  let unsubscribe: (() => void) | null = null

  /*
    Fixes #7275
    In a few cases, the observer could unmount before the resource is loaded.
    This leads to Suspense boundaries to be suspended indefinitely.
    This resolver will be called when the observer is unmounting
    but the resource is still in a loading state
  */
  let resolver: ((value: ResourceData) => void) | null = null
  const queryResource = createMemo<ResourceData>(
    () => {
      const obs = observer()
      return new Promise((resolve, reject) => {
        resolver = resolve
        if (isServer) {
          unsubscribe = createServerSubscriber((data) => {
            resolve(data as ResourceData)
          }, reject)
        } else if (!unsubscribe && !isRestoring()) {
          unsubscribe = createClientSubscriber()
        }
        obs.updateResult()

        if (
          observerResult.isError &&
          !observerResult.isFetching &&
          !isRestoring() &&
          shouldThrowError(obs.options.throwOnError, [
            observerResult.error,
            obs.getCurrentQuery(),
          ])
        ) {
          setStateWithReconciliation(observerResult)
          return reject(observerResult.error)
        }
        if (!observerResult.isLoading) {
          resolver = null
          return resolve(
            hydratableObserverResult(obs.getCurrentQuery(), observerResult),
          )
        }

        setStateWithReconciliation(observerResult)
      })
    },
  )

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

  const handler = {
    get(
      target: QueryObserverResult<TData, TError>,
      prop: keyof QueryObserverResult<TData, TError>,
    ): any {
      if (prop === 'data') {
        if (state.data !== undefined) {
          return latest(queryResource);
        }
        return queryResource().data
      }
      return Reflect.get(target, prop)
    },
  }

  return new Proxy(state, handler)
}
