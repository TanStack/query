import type { QueryObserverOf, RuntimeBinding } from './binding'
import type { QueryObserverResultReader } from './queryObserver'
import type {
  DefaultedQueryObserverOptions,
  QueryObserverResult,
} from './types'

type QueriesObserverListener = (result: Array<QueryObserverResult>) => void

type CombineFn<TCombinedResult> = (
  result: Array<QueryObserverResult>,
) => TCombinedResult

/** A cached reader for multiple query results and their combined value. */
export interface QueriesObserverResultReader<
  TCombinedResult,
> extends QueryObserverResultReader<Array<QueryObserverResult>> {
  /** Track result properties and combine the results with this reader's options. */
  combineResult: (result: Array<QueryObserverResult>) => TCombinedResult
}

type CombineContext<TCombinedResult> = {
  result?: Array<QueryObserverResult>
  combine?: CombineFn<TCombinedResult>
  value?: TCombinedResult
  queryHashes?: Array<string>
}

/**
 * Options for a `QueriesObserver` that apply to all of its queries at once.
 */
export interface QueriesObserverOptions<
  TCombinedResult = Array<QueryObserverResult>,
> {
  /**
   * A function that combines the array of `QueryObserverResult`s (one per
   * observed query) into a single value. The combined value is memoized and
   * only recomputed when one of the underlying results, the query hashes, or
   * the `combine` function itself changes.
   *
   * Defaults to returning the array of `QueryObserverResult`s unchanged.
   */
  combine?: CombineFn<TCombinedResult>
}

type QueryObserverMatch<TRuntime extends RuntimeBinding> = {
  defaultedQueryOptions: DefaultedQueryObserverOptions<TRuntime>
  observer: QueryObserverOf<TRuntime>
  reader?: QueryObserverResultReader<QueryObserverResult>
}

export type {
  QueriesObserverListener,
  CombineFn,
  CombineContext,
  QueryObserverMatch,
}
