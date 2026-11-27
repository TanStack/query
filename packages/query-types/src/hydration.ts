import type { MutationOf, QueryOf, RuntimeBinding } from './binding'
import type { MutationState } from './mutation'
import type { QueryState } from './query'
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

export type TransformerFn = (data: any) => any

/**
 * Options for `dehydrate`, controlling which queries/mutations are included in the resulting `DehydratedState` and
 * how their data/errors are transformed before being serialized (e.g. for embedding in server-rendered markup).
 */
export interface DehydrateOptions<TRuntime extends RuntimeBinding> {
  /** Transforms a query's `data` before it is dehydrated. Useful for non-JSON-serializable data. */
  serializeData?: TransformerFn
  /** Predicate to decide whether a given `Mutation` should be dehydrated. Defaults to `defaultShouldDehydrateMutation`. */
  shouldDehydrateMutation?: (mutation: MutationOf<TRuntime>) => boolean
  /** Predicate to decide whether a given `Query` should be dehydrated. Defaults to `defaultShouldDehydrateQuery`. */
  shouldDehydrateQuery?: (query: QueryOf<TRuntime>) => boolean
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
export interface HydrateOptions<TRuntime extends RuntimeBinding> {
  /** Options applied to the queries and mutations restored from the dehydrated state. */
  defaultOptions?: {
    /** Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`. */
    deserializeData?: TransformerFn
    /** Default options merged into every query restored from the dehydrated state. */
    queries?: QueryOptions<TRuntime>
    /** Default options merged into every mutation restored from the dehydrated state. */
    mutations?: MutationOptions<
      TRuntime,
      unknown,
      DefaultError,
      unknown,
      unknown
    >
  }
}

export interface DehydratedMutation {
  mutationKey?: MutationKey
  state: MutationState
  meta?: MutationMeta
  scope?: MutationScope
}

export interface DehydratedQuery {
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
  /**
   * The dehydrated mutations, by default only the paused ones.
   */
  mutations: Array<DehydratedMutation>
  /**
   * The dehydrated queries, by default only the successful ones.
   */
  queries: Array<DehydratedQuery>
}
