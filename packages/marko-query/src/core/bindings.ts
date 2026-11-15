import {
  MutationObserver,
  QueriesObserver,
  QueryClient,
  QueryObserver,
  defaultShouldDehydrateQuery,
  dehydrate,
  environmentManager,
  hydrate,
  noop,
  notifyManager,
  replaceEqualDeep,
  shouldThrowError,
} from '@tanstack/query-core'
import { hydrateOnce, isRestoring, onRestoringChange } from './client.js'
import type {
  DefaultedQueryObserverOptions,
  DehydratedState,
  MutationFilters,
  MutationObserverResult,
  MutationState,
  QueryFilters,
  QueryObserverOptions,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { MutationStateOptions } from './types.js'

type AnyQueryObserver = QueryObserver<any, any, any, any, any>
type ObserverClass = new (client: QueryClient, options: any) => AnyQueryObserver
type AnyOptions = QueryObserverOptions<any, any, any, any, any>
type Defaulted = DefaultedQueryObserverOptions<any, any, any, any, any> & {
  subscribed?: boolean
}

/**
 * An error that `throwOnError` asks to throw. It is a wrapper, not the error
 * itself, so that a query which rejects with `undefined` is still
 * distinguishable from a query that did not fail.
 */
export interface Thrown {
  /** The error to throw. It may be `undefined`. */
  error: unknown
}

/**
 * What a tag renders on the server and resumes with in the browser: the
 * result without its functions, the dehydrated cache entries it observes
 * (server only), and the error to throw when `throwOnError` asks for it.
 */
export interface Snapshot<TResult> {
  /** The plain result, or the plain results of `<queries>`. */
  result: TResult
  /** The dehydrated cache entries that the result observes. */
  hydration?: DehydratedState
  /** The error to throw when `throwOnError` asks for it. */
  thrown?: Thrown
}

/**
 * Drops the members that cannot be serialized: the result's functions.
 * @param result - The observer result.
 * @returns A copy of `result` without its functions.
 */
export function toPlainResult<T extends object>(result: T): T {
  const plain: Record<string, unknown> = {}
  for (const key in result) {
    const value = (result as Record<string, unknown>)[key]
    if (typeof value !== 'function') plain[key] = value
  }
  return plain as T
}

/**
 * Applies the client's defaults to query options, and sets how the result is
 * computed while the cache is restoring.
 *
 * `_optimisticResults` is left unset when the tag will not subscribe: core
 * would otherwise predict a fetch that never starts, and the result would
 * report `isFetching: true` forever.
 * @param client - The client that holds the defaults.
 * @param options - The options of the query.
 * @returns The options with the defaults applied.
 */
function defaultOptions(
  client: QueryClient,
  options: AnyOptions & { subscribed?: boolean },
): Defaulted {
  const defaulted = client.defaultQueryOptions(options)
  defaulted._optimisticResults = isRestoring(client)
    ? 'isRestoring'
    : options.subscribed === false
      ? undefined
      : 'optimistic'
  return defaulted
}

/**
 * Whether `throwOnError` asks to throw `error`.
 * @param result - The result to check.
 * @param observer - The observer that made the result.
 * @returns The error to throw, wrapped, or `undefined`.
 */
function thrownError(
  result: QueryObserverResult<any, any>,
  observer: AnyQueryObserver,
): Thrown | undefined {
  const query = observer.getCurrentQuery()
  if (
    result.isError &&
    !result.isFetching &&
    shouldThrowError(observer.options.throwOnError, [result.error, query])
  ) {
    return { error: result.error }
  }
  return undefined
}

/**
 * The cache entries for `hashes`, dehydrated with the client's own dehydrate
 * defaults (`shouldDehydrateQuery`, `serializeData`, `shouldRedactErrors`).
 * @param client - The client to dehydrate.
 * @param hashes - The hashes of the queries to include.
 * @returns The state, or `undefined` in the browser or when no entry matches.
 */
function dehydrateHashes(
  client: QueryClient,
  hashes: ReadonlySet<string>,
): DehydratedState | undefined {
  if (!environmentManager.isServer()) return undefined
  const filter =
    client.getDefaultOptions().dehydrate?.shouldDehydrateQuery ??
    defaultShouldDehydrateQuery
  const state = dehydrate(client, {
    shouldDehydrateQuery: (query) =>
      hashes.has(query.queryHash) && filter(query),
    shouldDehydrateMutation: () => false,
  })
  return state.queries.length ? state : undefined
}

/**
 * Reads the optimistic result of one (infinite) query without subscribing.
 * @param client - The client to read from.
 * @param options - The `queryKey`, `queryFn` and the other observer options.
 * @param Observer - `QueryObserver`, or `InfiniteQueryObserver` for an infinite query.
 * @returns The snapshot to render.
 */
export function readQuery<TResult>(
  client: QueryClient,
  options: AnyOptions,
  Observer: ObserverClass = QueryObserver,
): Snapshot<TResult> {
  const defaulted = defaultOptions(client, options)
  const observer = new Observer(client, defaulted)
  const result = observer.getOptimisticResult(defaulted)
  return {
    result: toPlainResult(result) as TResult,
    hydration: dehydrateHashes(client, new Set([defaulted.queryHash])),
    thrown: thrownError(result, observer),
  }
}

/** Receives each result and the error `throwOnError` asks to throw, if any. */
export type QueryListener = (
  result: QueryObserverResult<any, any>,
  thrown: Thrown | undefined,
) => void

/**
 * The browser side of one (infinite) query: hydrates what the server sent,
 * observes the query, and reports every result, starting with the current one.
 */
export class QueryBinding<TObserver extends AnyQueryObserver = QueryObserver> {
  readonly observer: TObserver
  readonly client: QueryClient
  #options: Defaulted
  #unsubscribe: () => void = noop
  #unwatchRestoring: () => void
  #onResult: QueryListener
  #destroyed = false

  constructor(
    client: QueryClient,
    options: AnyOptions,
    onResult: QueryListener,
    Observer: ObserverClass = QueryObserver,
    hydration?: DehydratedState,
  ) {
    if (hydration) hydrate(client, hydration)
    this.client = client
    this.#onResult = onResult
    this.#options = defaultOptions(client, options)
    this.observer = new Observer(client, this.#options) as TObserver
    this.#emit(this.observer.getOptimisticResult(this.#options))
    this.#subscribe()
    this.#unwatchRestoring = onRestoringChange(client, () => {
      this.#options = defaultOptions(client, this.#options)
      this.#subscribe()
    })
  }

  #subscribe(): void {
    this.#unsubscribe()
    const subscribe =
      !isRestoring(this.client) && this.#options.subscribed !== false
    this.#unsubscribe = subscribe
      ? this.observer.subscribe(
          notifyManager.batchCalls((result) => {
            // A notification queued before `destroy` still runs after it.
            if (!this.#destroyed) this.#emit(result)
          }),
        )
      : noop
    // Pick up any update between creating the observer and subscribing to it.
    this.observer.updateResult()
    this.#emit(this.observer.getOptimisticResult(this.#options))
  }

  #emit(result: QueryObserverResult<any, any>): void {
    this.#onResult(result, thrownError(result, this.observer))
  }

  /**
   * Reads the current result, with its functions.
   * @returns The current observer result.
   */
  getResult(): QueryObserverResult<any, any> {
    return this.observer.getCurrentResult()
  }

  /**
   * Applies new options to the observer, and reports the result.
   * @param options - The new options of the query.
   */
  setOptions(options: AnyOptions): void {
    if (this.#destroyed) return
    const wasSubscribed = this.#options.subscribed !== false
    this.#options = defaultOptions(this.client, options)
    const subscribed = this.#options.subscribed !== false
    // Unsubscribe before applying the options: `setOptions` fetches when the
    // observer has listeners, and the caller opted out of that fetch.
    if (wasSubscribed && !subscribed) this.#unsubscribe()
    this.observer.setOptions(this.#options)
    if (wasSubscribed !== subscribed) {
      this.#subscribe()
    } else {
      this.#emit(this.observer.getOptimisticResult(this.#options))
    }
  }

  /** Stops observing the query. It cannot be used again. */
  destroy(): void {
    if (this.#destroyed) return
    this.#destroyed = true
    this.#unsubscribe()
    this.#unwatchRestoring()
    this.observer.destroy()
  }
}

/**
 * The input of `<queries>`: the queries to run, an optional `combine`, and
 * whether to subscribe to them.
 */
export interface QueriesInput {
  /** The options of each query to run. */
  queries: ReadonlyArray<AnyOptions>
  /** Maps the results to one value. */
  combine?: (results: any) => unknown
  /**
   * Set to `false` to stop observing the queries: no fetch is triggered by
   * them, and no cache update reaches the tag. The tag still applies new
   * options, so a changed `queryKey` renders the result of the new query. One
   * flag for the whole tag, not one per query.
   */
  subscribed?: boolean
}

/**
 * Applies the client's defaults to each query of `<queries>`.
 * @param client - The client that holds the defaults.
 * @param input - The `queries` and `combine` of the tag.
 * @returns The options of each query with the defaults applied.
 */
function defaultQueries(
  client: QueryClient,
  input: QueriesInput,
): Array<Defaulted> {
  return input.queries.map((query) =>
    defaultOptions(client, {
      ...query,
      subscribed: input.subscribed,
    } as AnyOptions),
  )
}

/**
 * Reads the optimistic results of the observer and applies `combine`.
 * @param observer - The observer that watches all the queries.
 * @param queries - The options of each query, with the defaults applied.
 * @param combine - The `combine` function of the input, if it has one.
 * @returns The results and the combined value.
 */
function queriesResult(
  observer: QueriesObserver<any>,
  queries: Array<Defaulted>,
  combine: QueriesInput['combine'],
): QueriesValue {
  const [results, getCombined] = observer.getOptimisticResult(
    queries,
    combine as never,
  )
  return { results, combined: combine ? getCombined(results) : undefined }
}

/**
 * What `<queries>` renders: the plain results, or `combine`'s output.
 * @param value - The value that `<queries>` observes.
 * @param combine - The `combine` function of the input, if it has one.
 * @returns The `combine` output, or the plain results.
 */
export function toPlainQueries(
  value: QueriesValue,
  combine: QueriesInput['combine'],
): unknown {
  return combine ? value.combined : value.results.map(toPlainResult)
}

/**
 * Reads the optimistic results of several queries without subscribing.
 * @param client - The client to read from.
 * @param input - The `queries` and the optional `combine`.
 * @returns The snapshot to render.
 */
export function readQueries(
  client: QueryClient,
  input: QueriesInput,
): Snapshot<unknown> {
  const queries = defaultQueries(client, input)
  const observer = new QueriesObserver(client, queries)
  const value = queriesResult(observer, queries, input.combine)
  const observers = observer.getObservers()
  return {
    result: toPlainQueries(value, input.combine),
    hydration: dehydrateHashes(
      client,
      new Set(queries.map((query) => query.queryHash)),
    ),
    thrown: queriesError(value.results, observers),
  }
}

/**
 * Finds the first error that `throwOnError` asks to throw.
 * @param results - The result of each query.
 * @param observers - The observer of each query, in the same order.
 * @returns The error to throw, wrapped, or `undefined`.
 */
function queriesError(
  results: Array<QueryObserverResult<any, any>>,
  observers: Array<AnyQueryObserver>,
): Thrown | undefined {
  for (let index = 0; index < results.length; index++) {
    const observer = observers[index]
    const thrown = observer && thrownError(results[index]!, observer)
    if (thrown) return thrown
  }
  return undefined
}

/** Receives the value of `<queries>` and the error `throwOnError` asks to throw. */
export type QueriesListener = (
  value: QueriesValue,
  thrown: Thrown | undefined,
) => void

/** What the observer of `<queries>` reports. */
export interface QueriesValue {
  /** The result of each query. */
  results: Array<QueryObserverResult<any, any>>
  /** The output of `combine`, or `undefined` when there is no `combine`. */
  combined: unknown
}

/** The browser side of `<queries>`, like {@link QueryBinding}. */
export class QueriesBinding {
  readonly observer: QueriesObserver<any>
  readonly client: QueryClient
  #input: QueriesInput
  #queries: Array<Defaulted>
  #unsubscribe: () => void = noop
  #unwatchRestoring: () => void
  #onResult: QueriesListener
  #destroyed = false

  constructor(
    client: QueryClient,
    input: QueriesInput,
    onResult: QueriesListener,
    hydration?: DehydratedState,
  ) {
    if (hydration) hydrate(client, hydration)
    this.client = client
    this.#input = input
    this.#onResult = onResult
    this.#queries = defaultQueries(client, input)
    this.observer = new QueriesObserver(client, this.#queries, {
      combine: input.combine,
    } as never)
    this.#report()
    this.#subscribe()
    this.#unwatchRestoring = onRestoringChange(client, () => {
      this.#queries = defaultQueries(client, this.#input)
      this.#subscribe()
    })
  }

  #report(): void {
    const value = queriesResult(
      this.observer,
      this.#queries,
      this.#input.combine,
    )
    this.#onResult(
      value,
      queriesError(value.results, this.observer.getObservers()),
    )
  }

  #subscribe(): void {
    this.#unsubscribe()
    const subscribe =
      !isRestoring(this.client) && this.#input.subscribed !== false
    this.#unsubscribe = subscribe
      ? this.observer.subscribe(
          notifyManager.batchCalls(() => {
            // A notification queued before `destroy` still runs after it.
            if (!this.#destroyed) this.#report()
          }),
        )
      : noop
    this.#report()
  }

  /**
   * Applies a new input to the observer, and reports the value.
   * @param input - The new queries and `combine`.
   */
  setOptions(input: QueriesInput): void {
    if (this.#destroyed) return
    const wasSubscribed = this.#input.subscribed !== false
    this.#input = input
    this.#queries = defaultQueries(this.client, input)
    const subscribed = input.subscribed !== false
    // Unsubscribe before applying the queries: `setQueries` subscribes new
    // observers, and the caller opted out of that.
    if (wasSubscribed && !subscribed) this.#unsubscribe()
    this.observer.setQueries(this.#queries, { combine: input.combine } as never)
    if (wasSubscribed !== subscribed) this.#subscribe()
    else this.#report()
  }

  /** Stops observing the queries. It cannot be used again. */
  destroy(): void {
    if (this.#destroyed) return
    this.#destroyed = true
    this.#unsubscribe()
    this.#unwatchRestoring()
    this.observer.destroy()
  }
}

let idle: MutationObserverResult<any, any, any, any> | undefined

/**
 * The result of a mutation that has not run, without functions. It does not
 * depend on the options, so a tag's state is not reset when they change.
 * @returns A result with `status` set to `idle` and no data.
 */
export function idleMutationResult(): MutationObserverResult<
  any,
  any,
  any,
  any
> {
  return (idle ??= toPlainResult(
    new MutationObserver(new QueryClient(), {}).getCurrentResult(),
  ))
}

/**
 * The browser side of one mutation. The observer exists from construction, so
 * `mutate` works at any time; `subscribe` starts reporting results.
 */
export class MutationBinding {
  readonly observer: MutationObserver<any, any, any, any>
  readonly client: QueryClient
  #unsubscribe: () => void = noop
  #destroyed = false

  constructor(client: QueryClient, options: object) {
    this.client = client
    this.observer = new MutationObserver(client, options as never)
  }

  /**
   * Reports the current result, and then every change.
   * @param onResult - Called with each mutation result.
   */
  subscribe(
    onResult: (result: MutationObserverResult<any, any, any, any>) => void,
  ): void {
    this.#unsubscribe()
    onResult(this.observer.getCurrentResult())
    this.#unsubscribe = this.observer.subscribe(
      notifyManager.batchCalls((result) => {
        // A notification queued before `destroy` still runs after it.
        if (!this.#destroyed) onResult(result)
      }),
    )
  }

  /**
   * Applies new options to the observer.
   * @param options - The new options of the mutation.
   */
  setOptions(options: object): void {
    this.observer.setOptions(options as never)
  }

  /**
   * Reads the current result, with its functions.
   * @returns The current observer result.
   */
  getResult(): MutationObserverResult<any, any, any, any> {
    return this.observer.getCurrentResult()
  }

  /**
   * Whether `throwOnError` asks to throw `error`.
   * @param error - The error that the mutation failed with.
   * @returns `true` when the error must be thrown.
   */
  shouldThrow(error: unknown): boolean {
    return shouldThrowError(this.observer.options.throwOnError, [error])
  }

  /**
   * Runs the mutation. Errors are reported through the result.
   * @param variables - The value that is passed to `mutationFn`.
   * @param options - Callbacks that apply to this call only.
   */
  mutate = (variables: unknown, options?: object): void => {
    this.observer.mutate(variables, options as never).catch(noop)
  }

  mutateAsync = (variables: unknown, options?: object): Promise<unknown> =>
    this.observer.mutate(variables, options as never)

  reset = (): void => {
    this.observer.reset()
  }

  /** Stops reporting results. */
  destroy(): void {
    this.#destroyed = true
    this.#unsubscribe()
    this.#unsubscribe = noop
  }
}

/** A cache-wide value (`isFetching`, `isMutating`, mutation state) kept live. */
export class CacheWatcher<TInput, TValue> {
  #input: TInput
  #value: TValue
  #read: (input: TInput) => TValue
  #onValue: (value: TValue) => void
  #unsubscribe: () => void
  #destroyed = false

  constructor(
    subscribe: (listener: () => void) => () => void,
    read: (input: TInput) => TValue,
    input: TInput,
    onValue: (value: TValue) => void,
  ) {
    this.#input = input
    this.#read = read
    this.#onValue = onValue
    this.#value = read(input)
    onValue(this.#value)
    this.#unsubscribe = subscribe(
      notifyManager.batchCalls(() => {
        // A notification queued before `destroy` still runs after it.
        if (!this.#destroyed) this.#refresh()
      }),
    )
    this.#refresh()
  }

  #refresh(): void {
    const next = replaceEqualDeep(this.#value, this.#read(this.#input))
    if (next !== this.#value) {
      this.#value = next
      this.#onValue(next)
    }
  }

  /**
   * Replaces the input and reads the value again.
   * @param input - The new input.
   */
  setInput(input: TInput): void {
    this.#input = input
    this.#refresh()
  }

  /** Stops watching the cache. */
  destroy(): void {
    this.#destroyed = true
    this.#unsubscribe()
    this.#unsubscribe = noop
  }
}

/**
 * Reads the number of queries that are fetching.
 * @param client - The client to read from.
 * @param filters - Selects which queries to count.
 * @returns The number of matching queries that are fetching.
 */
export function readIsFetching(
  client: QueryClient,
  filters?: QueryFilters,
): number {
  return client.isFetching(filters)
}

/**
 * Keeps the number of fetching queries live.
 * @param client - The client to watch.
 * @param filters - Selects which queries to count.
 * @param onValue - Called with the number when it changes.
 * @returns The watcher. Call `destroy` to stop it.
 */
export function watchIsFetching(
  client: QueryClient,
  filters: QueryFilters | undefined,
  onValue: (value: number) => void,
): CacheWatcher<QueryFilters | undefined, number> {
  return new CacheWatcher(
    (listener) => client.getQueryCache().subscribe(listener),
    (input) => client.isFetching(input),
    filters,
    onValue,
  )
}

/**
 * Reads the number of mutations that are pending.
 * @param client - The client to read from.
 * @param filters - Selects which mutations to count.
 * @returns The number of matching mutations that are pending.
 */
export function readIsMutating(
  client: QueryClient,
  filters?: MutationFilters,
): number {
  return client.isMutating(filters)
}

/**
 * Keeps the number of pending mutations live.
 * @param client - The client to watch.
 * @param filters - Selects which mutations to count.
 * @param onValue - Called with the number when it changes.
 * @returns The watcher. Call `destroy` to stop it.
 */
export function watchIsMutating(
  client: QueryClient,
  filters: MutationFilters | undefined,
  onValue: (value: number) => void,
): CacheWatcher<MutationFilters | undefined, number> {
  return new CacheWatcher(
    (listener) => client.getMutationCache().subscribe(listener),
    (input) => client.isMutating(input),
    filters,
    onValue,
  )
}

/**
 * Reads the state of the mutations that match the options.
 * @param client - The client to read from.
 * @param options - The `filters` and `select` to use.
 * @returns One value for each matching mutation.
 */
export function readMutationState<TResult = MutationState>(
  client: QueryClient,
  options: MutationStateOptions<TResult, any> = {},
): Array<TResult> {
  return client
    .getMutationCache()
    .findAll(options.filters)
    .map(
      (mutation) =>
        (options.select ? options.select(mutation) : mutation.state) as TResult,
    )
}

/**
 * Keeps the mutation state live.
 * @param client - The client to watch.
 * @param options - The `filters` and `select` to use.
 * @param onValue - Called with the values when they change.
 * @returns The watcher. Call `destroy` to stop it.
 */
export function watchMutationState<TResult = MutationState>(
  client: QueryClient,
  options: MutationStateOptions<TResult, any> | undefined,
  onValue: (value: Array<TResult>) => void,
): CacheWatcher<
  MutationStateOptions<TResult, any> | undefined,
  Array<TResult>
> {
  return new CacheWatcher(
    (listener) => client.getMutationCache().subscribe(listener),
    (input) => readMutationState(client, input),
    options,
    onValue,
  )
}

/**
 * The browser side of `<hydration-boundary>`: core `hydrate`, with paused
 * mutations hydrated once per client.
 * @param client - The client to hydrate.
 * @param state - The dehydrated state, if there is one.
 * @param options - Extra options for `hydrate`, such as `defaultOptions`.
 */
export function hydrateBoundary(
  client: QueryClient,
  state: DehydratedState | null | undefined,
  options?: Parameters<typeof hydrate>[2],
): void {
  hydrateOnce(client, state, options)
}
