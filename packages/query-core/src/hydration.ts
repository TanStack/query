import { createInfiniteFetch } from './infiniteQueryBehavior'
import { Mutation } from './mutation'
import {
  getDefaultOptions,
  getQueryCache,
  mutationCacheKey,
} from './queryClient'
import { serialScope } from './serialScope'
import { noop } from './utils'
import type { MutationState } from './mutation'
import type { Query, QueryState } from './query'
import type { QueryClient } from './queryClient'
import type {
  DefaultError,
  MutationKey,
  MutationMeta,
  MutationOptions,
  MutationScope,
  QueryKey,
  QueryMeta,
  QueryOptions,
} from './types'

interface DehydratedMutation {
  mutationKey?: MutationKey
  state: MutationState
  meta?: MutationMeta
  scope?: MutationScope
}

interface DehydratedQuery {
  queryHash: string
  queryKey: QueryKey
  state: QueryState
  dehydratedAt: number
  promise?: Promise<unknown>
  meta?: QueryMeta
  queryType?: 'infinite'
}

// TYPES
type TransformerFn = (data: any) => any

/**
 * Options for `dehydrate`, controlling which queries/mutations are included in the resulting `DehydratedState` and
 * how their data/errors are transformed before being serialized (e.g. for embedding in server-rendered markup).
 */
export interface DehydrateOptions {
  /** Transforms a query's `data` before it is dehydrated. Useful for non-JSON-serializable data. */
  serializeData?: TransformerFn
  /** Predicate to decide whether a given `Mutation` should be dehydrated. Defaults to `defaultShouldDehydrateMutation`. */
  shouldDehydrateMutation?: (mutation: Mutation) => boolean
  /** Predicate to decide whether a given `Query` should be dehydrated. Defaults to `defaultShouldDehydrateQuery`. */
  shouldDehydrateQuery?: (query: Query) => boolean
  /**
   * Predicate to decide whether a query's error should be redacted before dehydration. Errors are redacted
   * (replaced with a generic `Error('redacted')`) unless this function is provided and returns `false` for the
   * given error, in which case the original error is kept.
   */
  shouldRedactErrors?: (error: unknown) => boolean
}

/**
 * Options for `hydrate`, controlling the default options applied to queries/mutations restored from a
 * `DehydratedState`, and how to reverse any transformation applied by `DehydrateOptions.serializeData`.
 */
export interface HydrateOptions {
  /** Options applied to the queries and mutations restored from the dehydrated state. */
  defaultOptions?: {
    /** Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`. */
    deserializeData?: TransformerFn
    /** Default options merged into every query restored from the dehydrated state. */
    queries?: QueryOptions
    /** Default options merged into every mutation restored from the dehydrated state. */
    mutations?: MutationOptions<unknown, DefaultError, unknown, unknown>
  }
}

/**
 * Reads the value of a promise synchronously if it has already resolved, e.g. a thenable that
 * resolves within its `then` call.
 * @param promise - The promise to read.
 * @returns An object with the resolved `data`, or `undefined` if the promise hasn't resolved
 * synchronously (or resolved with `undefined`).
 */
function tryResolveSync(promise: PromiseLike<unknown>) {
  let data: unknown

  const thenResult = promise.then((result) => {
    data = result
    return result
  }, noop) as Partial<Promise<unknown>> | undefined

  // A synchronous thenable may return an object without a catch method.
  thenResult?.catch?.(noop)

  if (data !== undefined) {
    return { data }
  }

  return undefined
}

// FUNCTIONS

/**
 * Dehydrates a single `Mutation` into a serializable snapshot of its key, state, scope, and meta.
 * @param mutation - The mutation to dehydrate.
 * @returns The dehydrated mutation.
 */
function dehydrateMutation(mutation: Mutation): DehydratedMutation {
  return {
    mutationKey: mutation.options.mutationKey,
    state: mutation.state,
    ...(mutation.options.scope && { scope: { id: mutation.options.scope.id } }),
    ...(mutation.meta && { meta: mutation.meta }),
  }
}

/**
 * Prepares the in-flight promise of a pending query for dehydration: applies `serializeData` to its
 * result, and redacts its rejection error unless `shouldRedactErrors` returns `false` for it.
 * @param query - The pending query whose promise is dehydrated.
 * @param serializeData - Optional transform applied to the resolved data.
 * @param shouldRedactErrors - Optional predicate; if it returns `false` for the rejection error,
 * that
 * error is kept as-is instead of being redacted.
 * @returns The transformed promise, or `undefined` if the query has no in-flight promise.
 */
function dehydratePromise(
  query: Query,
  serializeData?: TransformerFn,
  shouldRedactErrors?: (error: unknown) => boolean,
): Promise<unknown> | undefined {
  const promise = query.promise?.then(serializeData).catch((error) => {
    if (shouldRedactErrors?.(error) === false) {
      // Reject original error if it should not be redacted
      throw error
    }
    // If not in production, log original error before rejecting redacted error
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `A query that was dehydrated as pending ended up rejecting. [${query.queryHash}]: ${error}; The error will be redacted in production builds`,
      )
    }
    throw new Error('redacted')
  })

  // Avoid unhandled promise rejections
  // We need the promise we dehydrate to reject to get the correct result into
  // the query cache, but we also want to avoid unhandled promise rejections
  // in whatever environment the prefetches are happening in.
  promise?.catch(noop)

  return promise
}

/**
 * Dehydrates a single `Query` into a serializable `DehydratedQuery` snapshot. Note that most query config (e.g.
 * `queryFn`, `staleTime`) is not dehydrated but instead meant to be configured again when consuming the
 * de/rehydrated data, typically with `useQuery` on the client. If the query is still `pending`, its in-flight
 * promise is dehydrated too so it can be resumed on the other side instead of re-fetched.
 * @param query - The query to dehydrate.
 * @param serializeData - Optional transform applied to `query.state.data` before it is included in the snapshot.
 * @param shouldRedactErrors - Optional predicate; if it returns `false` for the promise's rejection error, that
 * error is kept as-is instead of being redacted.
 * @returns The dehydrated query.
 */
export function dehydrateQuery(
  query: Query,
  serializeData?: TransformerFn,
  shouldRedactErrors?: (error: unknown) => boolean,
): DehydratedQuery {
  return {
    dehydratedAt: Date.now(),
    state: {
      ...query.state,
      ...(query.state.data !== undefined && {
        data: serializeData
          ? serializeData(query.state.data)
          : query.state.data,
      }),
    },
    queryKey: query.queryKey,
    queryHash: query.queryHash,
    ...(query.state.status === 'pending' && {
      promise: dehydratePromise(query, serializeData, shouldRedactErrors),
    }),
    ...(query.meta && { meta: query.meta }),
    ...(query.queryType && { queryType: query.queryType }),
  }
}

/**
 * The default `shouldDehydrateMutation` predicate used by `dehydrate`. Only dehydrates mutations that are
 * currently paused (e.g. paused by `networkMode` while offline).
 * @param mutation - The mutation to check.
 * @returns `true` if the mutation is paused.
 */
export function defaultShouldDehydrateMutation(mutation: Mutation) {
  return mutation.state.isPaused
}

/**
 * The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
 * `'success'`.
 * @param query - The query to check.
 * @returns `true` if the query's status is `'success'`.
 */
export function defaultShouldDehydrateQuery(query: Query) {
  return query.state.status === 'success'
}

/**
 * Dehydrates a `QueryClient`'s cache (queries and mutations) into a plain, serializable `DehydratedState`,
 * typically to embed in server-rendered markup and later restore into a client-side `QueryClient` via `hydrate`.
 * Which queries/mutations are included, and how their data/errors are transformed, is controlled by `options`,
 * falling back to the client's `dehydrate` default options, and finally to `defaultShouldDehydrateQuery` /
 * `defaultShouldDehydrateMutation`.
 * @param client - The client whose cache is dehydrated.
 * @param options - Controls which queries and mutations are included and how their data and errors
 * are transformed. Each option falls back to the client's `defaultOptions.dehydrate`.
 * @returns The dehydrated state, with the included `queries` and `mutations`.
 * @example
 * ```ts
 * const queryClient = new QueryClient()
 *
 * await query(queryClient, {
 *   queryKey: ['posts'],
 *   queryFn: getPosts,
 * })
 *
 * const dehydratedState = dehydrate(queryClient)
 * ```
 */
export function dehydrate(
  client: QueryClient,
  options: DehydrateOptions = {},
): DehydratedState {
  const defaults = getDefaultOptions(client).dehydrate
  const filterMutation =
    options.shouldDehydrateMutation ??
    defaults?.shouldDehydrateMutation ??
    defaultShouldDehydrateMutation

  const mutations =
    client[mutationCacheKey]
      ?.getAll()
      .flatMap((mutation) =>
        filterMutation(mutation) ? [dehydrateMutation(mutation)] : [],
      ) ?? []

  const filterQuery =
    options.shouldDehydrateQuery ??
    defaults?.shouldDehydrateQuery ??
    defaultShouldDehydrateQuery

  const shouldRedactErrors =
    options.shouldRedactErrors ?? defaults?.shouldRedactErrors

  const serializeData = options.serializeData ?? defaults?.serializeData

  const queries = getQueryCache(client)
    .getAll()
    .flatMap((query) =>
      filterQuery(query)
        ? [dehydrateQuery(query, serializeData, shouldRedactErrors)]
        : [],
    )

  return { mutations, queries }
}

/**
 * Restores a `DehydratedState` (as produced by `dehydrate`) into a `QueryClient`'s cache, typically to seed the
 * client with data already fetched on the server. `mutations` and `queries` are each optional on `dehydratedState`.
 * Queries not yet in the cache are built from the dehydrated snapshot; queries that already exist are only updated
 * when the dehydrated data is newer than what's already cached. Newly built queries have their `fetchStatus` reset
 * to `'idle'` so they don't hydrate stuck in a fetching state. If a dehydrated query still had an in-flight
 * promise, it is resumed via `query.fetch()` (reusing that promise as `initialPromise`) rather than re-invoking
 * `queryFn`.
 * @param client - The client whose cache is restored into.
 * @param dehydratedState - The dehydrated state, e.g. produced by `dehydrate` on the server.
 * @param options - `defaultOptions` merged into every restored query and mutation (on top of the
 * client's `defaultOptions.hydrate`), and `deserializeData` to reverse `serializeData`.
 * @example
 * ```ts
 * // dehydratedState was produced by `dehydrate` on the server
 * // and sent to the client, e.g. embedded in server-rendered markup.
 * const queryClient = new QueryClient()
 *
 * hydrate(queryClient, dehydratedState)
 * ```
 */
export function hydrate(
  client: QueryClient,
  dehydratedState: Partial<DehydratedState>,
  options?: HydrateOptions,
): void {
  dehydratedState.mutations?.forEach(({ state, scope, ...mutationOptions }) => {
    Mutation.build(
      client,
      {
        ...getDefaultOptions(client).hydrate?.mutations,
        ...options?.defaultOptions?.mutations,
        ...mutationOptions,
        ...(scope && { scope: serialScope(scope.id) }),
      },
      state,
    )
  })

  if (dehydratedState.queries)
    hydrateQueries(client, dehydratedState.queries, options)
}

/**
 * Restores just the queries accepted by a React hydration boundary.
 * @internal
 * @param client - The client receiving the entries.
 * @param queries - The serialized query entries.
 * @param options - Query restoration settings.
 */
export function hydrateQueries(
  client: QueryClient,
  queries: Array<DehydratedQuery>,
  options?: HydrateOptions,
): void {
  const queryCache = getQueryCache(client)
  const deserializeData =
    options?.defaultOptions?.deserializeData ??
    getDefaultOptions(client).hydrate?.deserializeData

  queries.forEach(
    ({
      queryKey,
      state,
      queryHash,
      meta,
      promise,
      dehydratedAt,
      queryType,
    }) => {
      const syncData = promise ? tryResolveSync(promise) : undefined
      const rawData = state.data === undefined ? syncData?.data : state.data
      const data =
        rawData === undefined
          ? rawData
          : deserializeData
            ? deserializeData(rawData)
            : rawData

      let query = queryCache.get(queryHash)
      const previous = query?.state
      const pending = previous?.status === 'pending'
      const fetching = previous?.fetchStatus === 'fetching'

      if (
        !previous ||
        state.dataUpdatedAt > previous.dataUpdatedAt ||
        (syncData && dehydratedAt > previous.dataUpdatedAt)
      ) {
        const resolved = state.status === 'pending' && data !== undefined
        // A synchronously resolved promise is successful at dehydration time. Preserve active
        // requests, and restore new or resolved paused queries in the idle state.
        const snapshot = {
          ...state,
          data,
          fetchStatus:
            resolved && !fetching
              ? ('idle' as const)
              : (previous?.fetchStatus ?? ('idle' as const)),
          ...(resolved && {
            status: 'success' as const,
            dataUpdatedAt: dehydratedAt,
          }),
        }
        if (query) {
          query.setState(snapshot)
        } else {
          query = queryCache.build(
            client,
            {
              ...getDefaultOptions(client).hydrate?.queries,
              ...options?.defaultOptions?.queries,
              queryKey,
              queryHash,
              meta,
              ...(queryType === 'infinite' && {
                _type: queryType,
                _prepareInfiniteFetch: createInfiniteFetch,
              }),
            },
            snapshot,
          )
        }
      }

      if (
        promise &&
        // If the data was synchronously available, there is no need to set up
        // a retryer and thus no reason to call fetch
        !syncData &&
        !pending &&
        !fetching &&
        // Only hydrate if dehydration is newer than any existing data,
        // this is always true for new queries
        query &&
        dehydratedAt > query.state.dataUpdatedAt
      ) {
        // This doesn't actually fetch - it just creates a retryer
        // which will re-use the passed `initialPromise`
        query
          .fetch(undefined, {
            // RSC transformed promises are not thenable
            initialPromise: Promise.resolve(promise).then(deserializeData),
          })
          // Avoid unhandled promise rejections
          .catch(noop)
      }
    },
  )
}

/**
 * A serializable snapshot of a `QueryClient`'s cache, as produced by `dehydrate` and consumed by `hydrate`. Typically
 * transported from server to client (e.g. embedded in server-rendered markup) to seed the client's cache with data
 * that has already been fetched, avoiding a redundant fetch on the client.
 */
export interface DehydratedState {
  /**
   * The dehydrated mutations, by default only the paused ones.
   */
  mutations: Array<DehydratedMutation>
  /**
   * The dehydrated queries, by default only the successful ones.
   */
  queries: Array<DehydratedQuery>
}
