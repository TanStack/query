import { noop } from './utils'
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
import type { QueryClient } from './queryClient'
import type { Query, QueryState } from './query'
import type { Mutation, MutationState } from './mutation'

// TYPES
type TransformerFn = (data: any) => any

function tryResolveSync(promise: PromiseLike<unknown>) {
  let data: unknown

  const thenResult = promise.then((result) => {
    data = result
    return result
  }, noop) as Promise<unknown> | undefined

  // .catch can be unavailable on certain kinds of thenable's
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  thenResult?.catch?.(noop)

  if (data !== undefined) {
    return { data }
  }

  return undefined
}

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
  defaultOptions?: {
    /** Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`. */
    deserializeData?: TransformerFn
    /** Default options merged into every query restored from the dehydrated state. */
    queries?: QueryOptions
    /** Default options merged into every mutation restored from the dehydrated state. */
    mutations?: MutationOptions<unknown, DefaultError, unknown, unknown>
  }
}

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

/**
 * A serializable snapshot of a `QueryClient`'s cache, as produced by `dehydrate` and consumed by `hydrate`. Typically
 * transported from server to client (e.g. embedded in server-rendered markup) to seed the client's cache with data
 * that has already been fetched, avoiding a redundant fetch on the client.
 */
export interface DehydratedState {
  mutations: Array<DehydratedMutation>
  queries: Array<DehydratedQuery>
}

// FUNCTIONS

function dehydrateMutation(mutation: Mutation): DehydratedMutation {
  return {
    mutationKey: mutation.options.mutationKey,
    state: mutation.state,
    ...(mutation.options.scope && { scope: mutation.options.scope }),
    ...(mutation.meta && { meta: mutation.meta }),
  }
}

function dehydratePromise(
  query: Query,
  serializeData?: TransformerFn,
  shouldRedactErrors?: (error: unknown) => boolean,
): Promise<unknown> | undefined {
  const promise = query.promise?.then(serializeData).catch((error) => {
    if (shouldRedactErrors?.(error) === false) {
      // Reject original error if it should not be redacted
      return Promise.reject(error)
    }
    // If not in production, log original error before rejecting redacted error
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `A query that was dehydrated as pending ended up rejecting. [${query.queryHash}]: ${error}; The error will be redacted in production builds`,
      )
    }
    return Promise.reject(new Error('redacted'))
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
 */
export function defaultShouldDehydrateMutation(mutation: Mutation) {
  return mutation.state.isPaused
}

/**
 * The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
 * `'success'`.
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
 * @example
 * ```ts
 * const queryClient = new QueryClient()
 *
 * await queryClient.prefetchQuery({
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
  const filterMutation =
    options.shouldDehydrateMutation ??
    client.getDefaultOptions().dehydrate?.shouldDehydrateMutation ??
    defaultShouldDehydrateMutation

  const mutations = client
    .getMutationCache()
    .getAll()
    .flatMap((mutation) =>
      filterMutation(mutation) ? [dehydrateMutation(mutation)] : [],
    )

  const filterQuery =
    options.shouldDehydrateQuery ??
    client.getDefaultOptions().dehydrate?.shouldDehydrateQuery ??
    defaultShouldDehydrateQuery

  const shouldRedactErrors =
    options.shouldRedactErrors ??
    client.getDefaultOptions().dehydrate?.shouldRedactErrors

  const serializeData =
    options.serializeData ?? client.getDefaultOptions().dehydrate?.serializeData

  const queries = client
    .getQueryCache()
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
  const mutationCache = client.getMutationCache()
  const queryCache = client.getQueryCache()
  const deserializeData =
    options?.defaultOptions?.deserializeData ??
    client.getDefaultOptions().hydrate?.deserializeData

  dehydratedState.mutations?.forEach(({ state, ...mutationOptions }) => {
    mutationCache.build(
      client,
      {
        ...client.getDefaultOptions().hydrate?.mutations,
        ...options?.defaultOptions?.mutations,
        ...mutationOptions,
      },
      state,
    )
  })

  dehydratedState.queries?.forEach(
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
      const existingQueryIsPending = query?.state.status === 'pending'
      const existingQueryIsFetching = query?.state.fetchStatus === 'fetching'

      // Do not hydrate if an existing query exists with newer data
      if (query) {
        const hasNewerSyncData =
          syncData && dehydratedAt > query.state.dataUpdatedAt
        if (
          state.dataUpdatedAt > query.state.dataUpdatedAt ||
          hasNewerSyncData
        ) {
          // Omit fetchStatus from dehydrated state so that query stays in its current fetchStatus
          const { fetchStatus: _ignored, ...serializedState } = state
          query.setState({
            ...serializedState,
            data,
            // If the query was pending at the moment of dehydration, but resolved to have data
            // before hydration, we can assume the query should be hydrated as successful.
            //
            // Since you can opt into dehydrating failed queries, and those can have data from
            // previous successful fetches, we make sure we only do this for pending queries.
            ...(state.status === 'pending' &&
              data !== undefined && {
                status: 'success' as const,
                dataUpdatedAt: dehydratedAt,
                // Preserve existing fetchStatus if the existing query is actively fetching.
                ...(!existingQueryIsFetching && {
                  fetchStatus: 'idle' as const,
                }),
              }),
          })
        }
      } else {
        // Restore query
        query = queryCache.build(
          client,
          {
            ...client.getDefaultOptions().hydrate?.queries,
            ...options?.defaultOptions?.queries,
            queryKey,
            queryHash,
            meta,
            _type: queryType,
          },
          // Reset fetch status to idle to avoid
          // query being stuck in fetching state upon hydration
          {
            ...state,
            data,
            fetchStatus: 'idle',
            // Like above, if the query was pending at the moment of dehydration but has data,
            // we can assume it should be hydrated as successful.
            status:
              state.status === 'pending' && data !== undefined
                ? 'success'
                : state.status,
            ...(state.status === 'pending' &&
              data !== undefined && {
                dataUpdatedAt: dehydratedAt,
              }),
          },
        )
      }

      if (
        promise &&
        // If the data was synchronously available, there is no need to set up
        // a retryer and thus no reason to call fetch
        !syncData &&
        !existingQueryIsPending &&
        !existingQueryIsFetching &&
        // Only hydrate if dehydration is newer than any existing data,
        // this is always true for new queries
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
