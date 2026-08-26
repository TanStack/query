import { noop, shouldThrowError } from '@tanstack/query-core'
import {
  createMemo,
  createProjection,
  createRenderEffect,
  createSignal,
  isPending as isValuePending,
  onCleanup,
  resolve,
  sharedConfig,
  untrack,
  useContext,
} from 'solid-js'
import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './isRestoring'
import { HydrationCoordinatorContext } from './hydrationChannel'
import type { UseBaseQueryOptions } from './types'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'
import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
  QueryState,
} from '@tanstack/query-core'

const isServer = typeof window === 'undefined'

/**
 * A read of a pending-idle query (disabled, or reset with nothing in flight)
 * has no value and nothing to wait on. Parking the reader on a promise that
 * never resolves suspends it into the nearest `<Loading>` boundary until the
 * query actually starts fetching (enabling it, a refetch, a cache write) —
 * at which point the version bump re-runs the compute and the superseded
 * in-flight is ignored by the engine.
 */
const NEVER: Promise<never> = new Promise(noop)

/** The scalar half of QueryState — `data` flows through the async node, not here. */
type MetaState = Omit<QueryState<unknown, unknown>, 'data' | 'fetchMeta'>

function metaFrom(state: QueryState<any, any>): MetaState {
  return {
    dataUpdateCount: state.dataUpdateCount,
    dataUpdatedAt: state.dataUpdatedAt,
    error: state.error,
    errorUpdateCount: state.errorUpdateCount,
    errorUpdatedAt: state.errorUpdatedAt,
    fetchFailureCount: state.fetchFailureCount,
    fetchFailureReason: state.fetchFailureReason,
    fetchStatus: state.fetchStatus,
    isInvalidated: state.isInvalidated,
    status: state.status,
  }
}

/** Internal seam: everything the read layer builds, for hooks that extend
 * the base result (`useInfiniteQuery` pagers ride the same entry). */
export interface BaseQueryLayer<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
> {
  result: QueryObserverResult<TData, TError>
  observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  /** Version-tracked: reading it subscribes to this query's cache events. */
  query: () => Query<TQueryFnData, TError, TQueryData, TQueryKey>
  defaultedOptions: Accessor<ReturnType<QueryClient['defaultQueryOptions']>>
  isFetching: () => boolean
  status: () => 'pending' | 'error' | 'success'
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
): QueryObserverResult<TData, TError> {
  return useBaseQueryLayer(options, Observer, queryClient).result
}

export function useBaseQueryLayer<
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
): BaseQueryLayer<TQueryFnData, TError, TData, TQueryData, TQueryKey> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  const isRestoring = useIsRestoring()

  /**
   * The most recently computed hash, updated on every options compute —
   * including holds, where the memo's committed face still serves the old
   * options. The cache-event filter below must match both: on a key switch
   * the new key's fetch settles *before* the hold commits, so filtering by
   * the committed hash alone drops that settle event and nothing downstream
   * (data recompute, meta projection) ever learns the fetch finished.
   */
  let latestHash: string | undefined
  let latestOptions:
    | DefaultedQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >
    | undefined
  const defaultedOptions = createMemo(() => {
    const defaulted = client().defaultQueryOptions(options())
    defaulted._optimisticResults = isRestoring() ? 'isRestoring' : 'optimistic'
    if (isServer) {
      defaulted.retry = false
      defaulted.throwOnError = true
    }
    latestHash = defaulted.queryHash
    latestOptions = defaulted
    return defaulted
  })

  /**
   * The observer is a lifecycle/policy engine only. Registering it pins the
   * query against garbage collection, engages mount-fetch policy
   * (`shouldFetchOnMount`), schedules `refetchInterval`, and gates
   * focus/reconnect refetches — all of which live behind observer
   * registration in query-core. Reactivity never touches its notifications
   * or result objects: the listener is a noop, and the reactive layer below
   * derives everything from cache events and fetch promises.
   *
   * `let`, not `const`: a reactive `queryClient` accessor can swap clients
   * mid-life, and the observer must be rebuilt against the new client (see
   * `syncClient` below).
   */
  let observer = untrack(() => new Observer(client(), defaultedOptions()))

  createRenderEffect(
    () => defaultedOptions(),
    (opts) => observer.setOptions(opts),
  )

  /**
   * `sharedConfig.hydrating` is Solid's own "this component is being
   * hydrated" flag, captured at setup. (The server build's sharedConfig
   * has no such field — undefined there, and unused.)
   */
  const hydratedMount =
    !isServer &&
    (sharedConfig as { hydrating?: boolean }).hydrating === true &&
    useContext(HydrationCoordinatorContext) !== null

  /**
   * One version signal per hook, bumped by cache events for this query hash.
   * This is the entire subscription model: any state transition on the query
   * (fetch dispatch, settle, invalidation, `setQueryData`, removal) re-runs
   * the derived reads below, which pull fresh state/promises from the cache.
   *
   * `ownedWrite`: a compute that reads through `query()` can itself create
   * the cache entry (`cache.build` → synchronous 'added' event → this
   * write), so the first bump can land inside whatever computation pulled
   * the entry into existence. This is channel-owned state, not that
   * computation's own — the same pattern as the router's per-key version
   * signals.
   */
  const [version, setVersion] = createSignal(0, { ownedWrite: true })
  const onCacheEvent = (event: { query: { queryHash: string } }) => {
    // Match the committed options hash OR the latest computed one (they
    // diverge during a hold — see `latestHash`).
    if (
      event.query.queryHash === untrack(defaultedOptions).queryHash ||
      event.query.queryHash === latestHash
    ) {
      setVersion((v) => v + 1)
    }
  }

  let observerSub: (() => void) | null = null
  let cacheSub: (() => void) | null = null
  let disposed = false
  /** Set once the mount flow decides the observer should be live — a client
   * swap re-attaches the rebuilt observer iff its predecessor was attached. */
  let shouldAttach = false
  let activeClient = untrack(client)

  const attach = () => {
    if (!disposed && !observerSub && !untrack(isRestoring)) {
      shouldAttach = true
      observerSub = observer.subscribe(noop)
    }
  }

  /**
   * Idempotent client re-pointing, called from the tracked `query()` read
   * (which every derived compute goes through) rather than a dedicated
   * watcher node — hydration id assignment is positional, so a client-only
   * effect here would shift every downstream id. On a swap the version
   * subscription moves to the new cache and the observer is rebuilt against
   * the new client, so policy fetches and cache events both follow the
   * client the hook is actually reading.
   */
  const syncClient = (c: QueryClient) => {
    if (isServer || c === activeClient) return
    activeClient = c
    cacheSub?.()
    cacheSub = c.getQueryCache().subscribe(onCacheEvent)
    observerSub?.()
    observerSub = null
    observer = new Observer(c, untrack(defaultedOptions))
    if (shouldAttach && !disposed && !untrack(isRestoring)) {
      observerSub = observer.subscribe(noop)
    }
  }

  if (!isServer) {
    cacheSub = activeClient.getQueryCache().subscribe(onCacheEvent)
    if (hydratedMount) {
      /**
       * On a hydrated mount the observer must not attach until this query's
       * dehydrated entry has been applied to the cache: attaching runs
       * query-core's mount policy (`shouldFetchOnMount`), and against a
       * not-yet-primed cache a still-fresh query looks empty and refetches.
       * The provider's coordinator resolves per query — a component hydrated
       * from an early flush goes live while later boundaries still stream —
       * and also resolves when the channel completes without an entry (an
       * SSR-errored query is not dehydrated; its component fetches
       * normally).
       *
       * Scheduled at setup, not from an effect: effect halves are deferred
       * while hydration is in progress, and on a streamed page that lasts
       * until the stream closes — per-query attach must not wait for it.
       */
      useContext(HydrationCoordinatorContext)!.whenQueryPrimed(
        untrack(defaultedOptions).queryHash,
        attach,
      )
    } else {
      createRenderEffect(
        () => isRestoring(),
        (restoring) => {
          if (!restoring) attach()
        },
      )
    }
    onCleanup(() => {
      disposed = true
      observerSub?.()
      observerSub = null
      cacheSub?.()
      cacheSub = null
    })
  }

  const query = (): Query<TQueryFnData, TError, TQueryData, TQueryKey> => {
    version()
    const c = client()
    syncClient(c)
    return c.getQueryCache().build(c, defaultedOptions() as any) as any
  }

  const isEnabled = () => {
    const opts = defaultedOptions()
    const enabled =
      typeof opts.enabled === 'function'
        ? (opts.enabled as (q: any) => boolean)(untrack(query))
        : opts.enabled
    return enabled !== false
  }

  const resolvePlaceholder = (
    opts: ReturnType<typeof defaultedOptions>,
  ): TQueryData | undefined => {
    const placeholder = opts.placeholderData
    if (placeholder === undefined) return undefined
    // The function form receives previous data/query in React Query as a
    // `keepPreviousData` vehicle. Solid 2 holds the previous committed value
    // natively while a new promise is pending, so previous-data plumbing is
    // unnecessary here; a function placeholder computes from nothing.
    return typeof placeholder === 'function'
      ? (placeholder as () => TQueryData | undefined)()
      : placeholder
  }

  /**
   * The data compute. It returns either a settled value or the live fetch
   * promise — the engine does the rest: pending reads suspend into
   * `<Loading>` (holding the previous committed value on refetch),
   * rejections surface to `<Errored>`, transitions hold commits until
   * in-flight answers land, and on the server the settled value serializes
   * for hydration adoption on the client.
   */
  // Stable promise identity across recomputes: mid-flight version bumps
  // (fetch dispatch, observer updates) re-run the data compute while the
  // same underlying fetch is pending. Chaining a fresh `.then` each time
  // would hand the engine a new pending promise per recompute — the node
  // keeps restarting its pending tracking and the settle can be missed
  // (observed as `isPending` probes stuck true after the fetch lands).
  let chained: {
    base: Promise<unknown>
    select: unknown
    value: TData
  } | null = null
  const chainOnce = (
    base: Promise<any>,
    select: unknown,
    applySelect: (d: any) => TData,
  ): TData => {
    if (chained?.base !== base || chained.select !== select) {
      chained = {
        base,
        select,
        value: base.then(applySelect) as unknown as TData,
      }
    }
    return chained.value
  }

  const computeData = (prev?: TData): TData => {
    const opts = defaultedOptions()
    const q = query()
    const state = q.state
    const select = opts.select as ((d: TQueryData) => TData) | undefined
    const applySelect = (d: any): TData =>
      select ? select(d as TQueryData) : (d as TData)

    // Placeholder: show immediately instead of suspending while the first
    // fetch runs. When the fetch lands the version bump swaps in real data.
    if (state.data === undefined && state.status === 'pending') {
      const placeholder = resolvePlaceholder(opts)
      if (placeholder !== undefined) return applySelect(placeholder)
    }

    // A fetch in flight (including paused-offline with a retryer attached):
    // hand the engine the promise. First load suspends; refetch holds the
    // previous committed value and marks the node pending — which is what
    // lets a mutation's invalidations hold its settle transition until
    // fresh data lands.
    //
    // Exception: a FIRST compute that already has a value to show
    // (initialData, hydrated or shared cache data with a mount refetch in
    // flight) returns the value — suspending would have nothing committed
    // to hold, blanking the UI on mount. The refetch stays observable via
    // fetchStatus; the settle lands through the next version bump.
    if (state.fetchStatus !== 'idle') {
      if (state.data === undefined || prev !== undefined) {
        const promise = q.promise
        if (promise) return chainOnce(promise, select, applySelect)
      }
    }

    if (state.status === 'error') {
      // No stale value to serve means the read cannot produce TData — the
      // rejection surfaces through the graph to the nearest <Errored>.
      // With stale data present, throw only if throwOnError opts in.
      if (
        state.data === undefined ||
        shouldThrowError(opts.throwOnError as any, [
          state.error as any,
          q as any,
        ])
      ) {
        throw state.error
      }
    }

    if (state.data !== undefined) return applySelect(state.data)

    // Pending-idle: nothing in flight, nothing cached. If the query is
    // enabled, the tracked read itself starts the fetch (the router
    // `query()` model — reads pull the async). This is not just the server
    // path: on the client it is what revives a query whose enabling change
    // arrives while the subtree is parked under a suspended boundary —
    // parked boundaries hold effects, so the observer's option-driven fetch
    // can never fire there, but computes still re-run. `q.fetch` dedupes
    // against any fetch the observer already started.
    if (isEnabled()) {
      /**
       * Never start a fetch inside the hydration window. Adoption
       * trace-runs this compute even on a hit (solid mocks `fetch` there,
       * but a TanStack fetch is invisible to that mock), and channel yields
       * apply interleaved with component claims — a query whose entry rides
       * a later yield than its component's claim would fetch here, wedge on
       * hydration's Promise mock inside its queryFn, and then swallow every
       * later legitimate refetch through retryer dedupe. During hydration
       * the value comes from adoption or channel priming; if a fetch is
       * genuinely needed, the post-priming observer attach issues it
       * outside the window.
       */
      if (!isServer && (sharedConfig as { hydrating?: boolean }).hydrating) {
        return NEVER as unknown as TData
      }
      /**
       * Same discipline while a persister is restoring: the restored value
       * is about to land in the cache, so pulling a fetch now would race
       * it. The read is tracked — `isRestoring` flipping false re-runs
       * this compute (and the deferred observer attach engages mount
       * policy), so the fetch fires then if the restore left a gap.
       */
      if (isRestoring()) {
        return NEVER as unknown as TData
      }
      /**
       * Sync observer policy before pulling. Under a suspended boundary
       * the options render effect is deferred, so on an enabled flip or
       * key change this compute runs first and the effect only lands
       * after the revival fetch settles — at which point a "changed"
       * options diff against now-stale data would issue a redundant
       * policy refetch. Syncing here means any policy fetch starts now
       * (and `q.fetch` dedupes into it), and the deferred effect later
       * sees the identical options object — a no-op diff.
       */
      if (!isServer) observer.setOptions(opts as any)
      return chainOnce(q.fetch(opts as any), select, applySelect)
    }
    return NEVER as unknown as TData
  }

  /**
   * The serialized face of the data node. On the server this is the async
   * node whose settled value rides Solid's hydration payload; on a
   * hydrating client it adopts that value and stays LATCHED to it until
   * hydration completes — solid's orphaning protection re-serves the
   * serialized value on every recompute while the stream is open, so this
   * node cannot double as the live read once the cache starts changing.
   */
  const adopted = createMemo<TData>(computeData)

  /**
   * The live face. On a hydrated mount it is a separate `transparent` memo
   * (shares the parent's id — consumes no hydration id slot on either side,
   * so server/client node alignment is preserved, and it is never latched):
   * while this query's entry has not been primed yet the cache is empty, so
   * it defers to the adopted server value — critically this also covers the
   * pending-idle branch, so the compute never starts a client fetch for
   * data the channel is about to deliver. From the first cache event on
   * (priming, `setQueryData`, refetches — each a version bump) it computes
   * from the cache like any fresh mount, which is what keeps hydrated
   * components live while other boundaries still stream.
   */
  const data = !hydratedMount
    ? adopted
    : createMemo<TData>(
        (prev) => {
          const state = query().state
          if (
            state.data === undefined &&
            state.status === 'pending' &&
            state.fetchStatus === 'idle'
          ) {
            return adopted()
          }
          return computeData(prev)
        },
        { transparent: true },
      )

  /**
   * Scalar result metadata.
   *
   * Client: a projection reconciled per-field from query state on every
   * cache event, so each field is its own fine-grained signal — a component
   * reading only `isFetching` re-runs on fetchStatus flips, not on every
   * state transition.
   *
   * Server: boundaries guarantee that only settled state serializes, and
   * meta must honor the same contract (solid's own `isPending` suspends
   * rather than ever serialize `true`). A projection cannot: its compute
   * runs once at setup and never re-pulls, freezing an in-flight snapshot
   * ('pending'/'fetching') into HTML that the hydrating client — reading
   * the primed, settled cache — contradicts. So on the server every meta
   * read pulls live query state, and while the entry is unsettled (pending
   * with a fetch in flight, or one it can start) the read ties itself to the data
   * node, which throws the pending read and holds the boundary until
   * settle. A disabled pending query is served as-is: 'pending' IS its
   * settled SSR truth, and the client hydrates the identical state.
   */
  const serverMeta = (): MetaState => {
    if (query().state.status === 'pending' && isEnabled()) data()
    return metaFrom(query().state)
  }
  /**
   * Created on BOTH sides even though the server never reads it: hydration
   * id assignment is positional, so every reactive node a hook creates on
   * the client must have a server counterpart (and vice versa) or every id
   * downstream shifts and hydration key-misses the whole subtree.
   */
  const metaProjection = createProjection<MetaState>(
    (draft) => {
      Object.assign(draft, metaFrom(query().state))
    },
    untrack(() => metaFrom(query().state)),
  )
  const meta = isServer
    ? new Proxy({} as MetaState, {
        get: (_, key) => serverMeta()[key as keyof MetaState],
      })
    : metaProjection

  /**
   * Server: read live counts instead of a setup snapshot — "mount" resolves
   * post-settle there, so `isFetchedAfterMount` serializes `false`, which is
   * exactly what the hydrating client computes (its mount snapshot equals
   * the hydrated counts).
   */
  const mountedAt = isServer
    ? {
        get dataUpdateCount() {
          return untrack(query).state.dataUpdateCount
        },
        get errorUpdateCount() {
          return untrack(query).state.errorUpdateCount
        },
      }
    : untrack(() => {
        const state = query().state
        return {
          dataUpdateCount: state.dataUpdateCount,
          errorUpdateCount: state.errorUpdateCount,
        }
      })

  const hasPlaceholder = () =>
    meta.status === 'pending' &&
    untrack(() => resolvePlaceholder(defaultedOptions())) !== undefined
  const status = () => (hasPlaceholder() ? 'success' : meta.status)
  const isPending = () => status() === 'pending'
  /**
   * A refetch of settled data is a transition: the state write that flips
   * `fetchStatus` to 'fetching' is held in the same batch as the pending
   * data node, so the committed meta channel cannot show it mid-hold — by
   * design, held updates commit atomically. The observable channel for
   * "a new answer is in flight" during a hold is core's pending probe.
   * The committed `fetchStatus` covers the first load (where the probe
   * would see an uninitialized node) and untracked/imperative reads.
   */
  const isFetching = () =>
    meta.fetchStatus === 'fetching' || isValuePending(() => data())
  const isError = () => status() === 'error'
  const isStale = () => {
    const opts = defaultedOptions()
    const q = untrack(query)
    const staleTime =
      typeof opts.staleTime === 'function'
        ? (opts.staleTime as (q: any) => number | 'static')(q)
        : opts.staleTime
    version()
    return q.isStaleByTime(staleTime)
  }

  const result = {
    get data() {
      return data()
    },
    get error() {
      return meta.error as TError | null
    },
    get status() {
      return status()
    },
    get fetchStatus() {
      return meta.fetchStatus
    },
    get isPending() {
      return isPending()
    },
    get isSuccess() {
      return status() === 'success'
    },
    get isError() {
      return isError()
    },
    get isLoading() {
      return isPending() && isFetching()
    },
    get isInitialLoading() {
      return isPending() && isFetching()
    },
    get isFetching() {
      return isFetching()
    },
    get isRefetching() {
      return isFetching() && !isPending()
    },
    get isPaused() {
      return meta.fetchStatus === 'paused'
    },
    get isEnabled() {
      return isEnabled()
    },
    get isLoadingError() {
      return isError() && meta.dataUpdatedAt === 0
    },
    get isRefetchError() {
      return isError() && meta.dataUpdatedAt !== 0
    },
    get isPlaceholderData() {
      return hasPlaceholder()
    },
    get isStale() {
      return isStale()
    },
    get isFetched() {
      return meta.dataUpdateCount > 0 || meta.errorUpdateCount > 0
    },
    get isFetchedAfterMount() {
      return (
        meta.dataUpdateCount > mountedAt.dataUpdateCount ||
        meta.errorUpdateCount > mountedAt.errorUpdateCount
      )
    },
    get dataUpdatedAt() {
      return meta.dataUpdatedAt
    },
    get errorUpdatedAt() {
      return meta.errorUpdatedAt
    },
    get failureCount() {
      return meta.fetchFailureCount
    },
    get failureReason() {
      return meta.fetchFailureReason as TError | null
    },
    get errorUpdateCount() {
      return meta.errorUpdateCount
    },
    get promise() {
      return resolve(() => data())
    },
    refetch: ((refetchOptions) => {
      // A held transition defers the setOptions render effect, so after a
      // key switch the observer can still carry the previous key's options.
      // Sync to the latest computed options first: an imperative refetch
      // targets what the UI is currently asking for, not what last
      // committed.
      if (!isServer && latestOptions) {
        observer.setOptions(latestOptions as any)
      }
      return observer.refetch(refetchOptions)
    }) as QueryObserverResult<TData, TError>['refetch'],
  }

  return {
    result: result as unknown as QueryObserverResult<TData, TError>,
    observer,
    query,
    defaultedOptions,
    isFetching,
    status,
  } as unknown as BaseQueryLayer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >
}
