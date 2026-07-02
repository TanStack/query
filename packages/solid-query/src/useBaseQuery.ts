// Had to disable the lint rule because isServer type is defined as false
// in solid-js/web package. I'll create a GitHub issue with them to see
// why that happens.
import {
  hydrate as coreHydrate,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import {
  createRenderEffect,
  createSignal,
  createStore,
  getObserver,
  isPending,
  onCleanup,
  reconcile,
  refresh,
  runWithOwner,
  sharedConfig,
  snapshot,
  untrack,
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

const isServer = typeof window === 'undefined'

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

  // Use createSignal(fn) instead of createMemo so these derived memos have
  // _preventAutoDisposal set. Without it, a createMemo that no one reads
  // reactively gets auto-disposed in Solid v2, which cascades and disposes
  // the component's onCleanup, unsubscribing the observer before the fetch
  // completes.
  const [client] = createSignal(() => useQueryClient(queryClient?.()))
  const isRestoring = useIsRestoring()
  // There are times when we run a query on the server but the resource is never read
  // This could lead to times when the queryObserver is unsubscribed before the resource has loaded
  // Causing a time out error. To prevent this we will queue the unsubscribe if the cleanup is called
  // before the resource has loaded
  let unsubscribeQueued = false

  const [defaultedOptions] = createSignal(() => {
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

  const observer = untrack(() => new Observer(client(), defaultedOptions()))

  // Track options reactively so the queryResource memo re-runs on change.
  const [trackedDefaultedOptions] = createSignal(() => defaultedOptions())

  // Apply options in an effect to avoid store writes inside the memo.
  // setOptions triggers updateResult → notify → subscription → setState,
  // which must run in an effect context in Solid v2.
  createRenderEffect(
    () => trackedDefaultedOptions(),
    (opts) => {
      // observer.setOptions synchronously invokes subscribers which write to
      // the store. In Solid v2, signal/store writes inside an owned scope
      // (like this render effect) throw. Escape the owner so subscriber
      // writes don't trip the guard.
      runWithOwner(null, () => observer.setOptions(opts))
    },
  )

  let observerResult = untrack(() =>
    observer.getOptimisticResult(defaultedOptions()),
  )

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
      runWithOwner(null, () => {
        setStateWithReconciliation(result)
        if (
          unsubscribe &&
          !disposed &&
          // Components that hydrated over a pending streamed query read
          // through the resource (see the Proxy below), so settled data
          // changes must re-run the resource compute for their JSX to
          // update. Only refresh on SETTLED changes — refreshing on every
          // in-flight transition mints a new pending promise per event and
          // trips Solid's infinite-loop flush guard.
          (previousResult.isLoading !== result.isLoading ||
            previousResult.isError !== result.isError ||
            (hydratedAsPending &&
              !result.isLoading &&
              previousResult.data !== result.data))
        ) {
          // Defer to a microtask: refreshing synchronously re-runs the
          // resource compute (which syncs the store) inside the flush that
          // is delivering this notification, tripping Solid's infinite-loop
          // flush guard under load.
          queueMicrotask(() => {
            if (disposed) return
            try {
              refresh(queryResource)
            } catch {
              // NotReadyError is expected when refreshing a memo that
              // returns a Promise. The Loading boundary handles this during
              // rendering.
            }
          })
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
  // Set whenever the resource Promise executor actually executes. When Solid
  // hydrates this computation over a SERIALIZED async value (a query that was
  // still pending when the server streamed the shell), it replays the compute
  // under a stubbed Promise (`subFetch`'s MockPromise, whose constructor never
  // invokes the executor) purely to re-establish reactive dependencies — the
  // executor's side effects (observer subscription, resolver wiring, store
  // sync) are silently dropped and the memo's value is taken from the
  // serialized payload instead. This flag lets the hydration recovery effect
  // below detect that case and re-wire what the replay discarded.
  let computeWired = false
  // Whether this component is being created by the hydration walk. All of the
  // MockPromise-replay recovery below is scoped to this case so regular
  // client mounts keep their exact current behavior.
  const wasHydrating = !isServer && sharedConfig.hydrating === true
  // Queries that finished on the server before dehydration hydrate the cache
  // synchronously, so the store already holds the resolved data during the
  // walk and the regular store-backed reads hydrate cleanly — those must keep
  // the exact pristine behavior. Only a query that is still PENDING at
  // hydration (it streamed as a serialized pending promise) needs the
  // resource-backed read path and the replay recovery below.
  const hydratedAsPending = wasHydrating && observerResult.isLoading

  /*
    Fixes #7275
    In a few cases, the observer could unmount before the resource is loaded.
    This leads to Suspense boundaries to be suspended indefinitely.
    This resolver will be called when the observer is unmounting
    but the resource is still in a loading state
  */
  let resolver: ((value: ResourceData) => void) | null = null
  // Use createSignal(fn) instead of createMemo so the derived memo has
  // _preventAutoDisposal set. Without it, a createMemo that no one reads
  // reactively gets auto-disposed in Solid v2, which would cascade-dispose
  // the component's onCleanup and unsubscribe the observer before fetch
  // completion.
  const [queryResource] = createSignal<ResourceData>(() => {
    // Read trackedDefaultedOptions to ensure this memo re-runs when options change
    const opts = trackedDefaultedOptions()
    // Read isRestoring unconditionally so the memo re-runs when it changes
    const restoring = isRestoring()

    if (isServer) {
      // On retry passes (after the streaming Loading boundary awaits a
      // pending Promise), the QueryClient cache already has the data, so
      // `getOptimisticResult` returns a non-loading result synchronously.
      // Returning the value directly (instead of a fresh Promise that
      // resolves synchronously) lets Solid's `processResult` set
      // `comp.value` directly without queueing another async settle. If we
      // returned a new Promise on every retry, Solid's streaming Loading
      // boundary `while (ret.p.length)` loop in `createLoadingBoundary`
      // would never terminate, because each retry adds a new pending
      // Promise to the boundary's tracked set even when it resolves
      // synchronously.
      const cached = observer.getOptimisticResult(opts)
      if (!cached.isLoading) {
        observerResult = cached
        runWithOwner(null, () => {
          setStateWithReconciliation(cached)
        })
        return hydratableObserverResult(
          observer.getCurrentQuery(),
          cached,
        ) as ResourceData
      }
    }

    return new Promise<ResourceData>((resolve, reject) => {
      computeWired = true
      resolver = resolve
      if (isServer) {
        unsubscribe = createServerSubscriber((data) => {
          resolve(data as ResourceData)
        }, reject)
      } else if (!unsubscribe && !restoring) {
        unsubscribe = createClientSubscriber()
      }
      // Use getOptimisticResult instead of updateResult to keep the memo
      // free of store writes (updateResult triggers notify → setState).
      const currentResult = observer.getOptimisticResult(opts)
      observerResult = currentResult

      // Store writes inside a memo's owned scope throw in Solid v2.
      // Escape the owner so setState calls are allowed.
      runWithOwner(null, () => {
        if (
          currentResult.isError &&
          !currentResult.isFetching &&
          !restoring &&
          shouldThrowError(opts.throwOnError, [
            currentResult.error,
            observer.getCurrentQuery(),
          ])
        ) {
          setStateWithReconciliation(currentResult)
          reject(currentResult.error)
          return
        }
        setStateWithReconciliation(currentResult)
      })

      if (
        currentResult.isError &&
        !currentResult.isFetching &&
        !restoring &&
        shouldThrowError(opts.throwOnError, [
          currentResult.error,
          observer.getCurrentQuery(),
        ])
      ) {
        return
      }
      if (!currentResult.isLoading) {
        resolver = null
        return resolve(
          hydratableObserverResult(observer.getCurrentQuery(), currentResult),
        )
      }
    })
  })

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

  if (wasHydrating) {
    // Hydration recovery. Solid restores this computation's memo from the
    // value the server serialized, so the compute's wiring never runs on
    // the client:
    //
    //  - SYNC serialized value (the query settled on the server before the
    //    shell flushed): the compute is skipped entirely.
    //  - ASYNC serialized value (the query streamed as a pending promise):
    //    the compute is replayed under Solid's MockPromise stub whose
    //    constructor never invokes the executor (see `computeWired`).
    //
    // Either way the QueryObserver subscription that normally gets wired
    // inside the resource Promise executor is dropped — the component
    // renders the hydrated snapshot correctly but never reacts to cache
    // updates (setQueryData, refetches, invalidations notify zero
    // subscribers).
    //
    // IMPORTANT CONSTRAINTS, both learned the hard way:
    //
    //  1. No owned computations may be created here. The server did not
    //     create them, so a client-only createRenderEffect shifts the
    //     hydration key of every subsequent computation in the component
    //     and JSX claiming fails ("unclaimed server-rendered node"
    //     warnings, duplicated inert DOM). Recovery therefore runs on
    //     unowned timers, guarded by `disposed`.
    //  2. Wiring must wait until hydration has FULLY completed. Boundary
    //     hydration is asynchronous (solid-js resumes Loading boundaries
    //     from streamed scripts), and subscribing earlier delivers an
    //     immediate observer notification (structuralSharing is disabled,
    //     so every result is a fresh object) whose store write re-renders
    //     the component mid-walk and breaks claiming the same way.
    //     `sharedConfig.done` flips true once all boundaries have resumed,
    //     so poll it.
    const recoverAfterHydration = () => {
      if (disposed) return
      if (
        sharedConfig.hydrating ||
        !(sharedConfig as any).done ||
        untrack(isRestoring)
      ) {
        setTimeout(recoverAfterHydration, 16)
        return
      }
      // The executor may have run natively in the meantime (e.g. an options
      // change re-ran the compute) — it wires the subscription itself.
      if (!unsubscribe) {
        unsubscribe = createClientSubscriber()
        // Catch up on cache changes that happened between store creation
        // and the subscription being established (e.g. a streamed query
        // chunk hydrated by the router integration). Skip the write when
        // nothing changed so a clean hydration stays untouched.
        const current = untrack(() =>
          observer.getOptimisticResult(defaultedOptions()),
        )
        const previous = observerResult
        if (
          current.status !== previous.status ||
          current.dataUpdatedAt !== previous.dataUpdatedAt ||
          current.data !== previous.data
        ) {
          observerResult = current
          runWithOwner(null, () => {
            setStateWithReconciliation(current)
          })
        }
      }
      if (hydratedAsPending && !computeWired) {
        finishPendingRecovery()
      }
    }
    // Second stage for streamed-pending queries: once the hydrated resource
    // settles (the streamed value arrived), seed the cache from the
    // serialized snapshot when nothing fresher exists (standalone Solid SSR
    // setups without a router integration streaming the cache separately),
    // then refresh the resource: the compute re-runs with the native
    // Promise, so its executor performs the full normal wiring against the
    // now-warm cache and the resource resolves with a live result.
    const finishPendingRecovery = () => {
      if (disposed || computeWired) return
      if (untrack(() => isPending(queryResource))) {
        setTimeout(finishPendingRecovery, 16)
        return
      }
      const resolved = untrack(queryResource)
      const hydrationData = (resolved as any)?.hydrationData
      if (hydrationData && hydrationData.state?.data !== undefined) {
        const existing = client().getQueryCache().get(hydrationData.queryHash)
        if (
          !existing ||
          (existing.state.data === undefined &&
            existing.state.dataUpdatedAt < hydrationData.state.dataUpdatedAt)
        ) {
          coreHydrate(client(), {
            mutations: [],
            queries: [hydrationData],
          })
        }
      }
      try {
        refresh(queryResource)
      } catch {
        // NotReadyError is expected when refreshing a memo that returns a
        // Promise. The Loading boundary handles this during rendering.
      }
    }
    recoverAfterHydration()
  }

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

      // On the server, force a Suspense dependency on the query resource so
      // the per-route Loading boundary catches NotReadyError, awaits the
      // pending Promise, and re-renders with the resolved state. Without
      // this, JSX reads through the Proxy never subscribe to queryResource
      // and SSR HTML reflects the initial loading state.
      //
      // Read the value from the *resolved resource* rather than `state`. When
      // the boundary suspends and re-renders after the query settles, the
      // `state` store is not synced (the server subscriber resolves the
      // resource Promise but does not write the store), so reading `state`
      // would render stale loading values. Reading the resolved resource keeps
      // the streamed SSR HTML consistent with the serialized resource, which
      // is what the client hydrates against.
      //
      // The same resource-first read applies on the CLIENT for components
      // created by the hydration walk. When a query streams as a pending
      // promise, Solid replays the resource compute under a stubbed Promise
      // to recover the serialized value, so the executor that normally
      // subscribes and syncs the store never ran and `state` would stay
      // stuck at pending. Reading through the resource keeps the component
      // on the server's async timeline (suspend until the streamed value
      // arrives, then render the serialized snapshot). Reads stay on the
      // resource for the lifetime of the hydrated component — JSX created
      // during hydration tracks the resource, and the client subscriber
      // refreshes it on every settled result change, so updates keep
      // flowing after recovery.
      if (isServer || (hydratedAsPending && !untrack(isRestoring))) {
        // Untracked client reads (e.g. logging in component setup) of a
        // still-pending resource would throw Solid's untracked-pending-read
        // error. Serve the store's optimistic pending state instead — the
        // same value an untracked setup read sees on a regular mount.
        if (!isServer && !getObserver() && isPending(queryResource)) {
          return Reflect.get(target, prop, receiver)
        }
        // Hydrated snapshots can transiently be undefined (e.g. a replayed
        // compute whose serialized value has not been delivered yet), even
        // though the declared type is always an object.
        const resolved = queryResource() as ResourceData | undefined
        if (resolved && prop in resolved) {
          return Reflect.get(resolved, prop)
        }
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
