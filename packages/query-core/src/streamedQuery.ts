import { findCachedQuery } from './queryCacheOperations'
import { getQueryCache, getQueryData, setQueryData } from './queryClient'
import { isQueryFetched } from './queryPredicates'
import { addConsumeAwareSignal, fetchSignal } from './utils'
import type {
  OmitKeyof,
  QueryFunction,
  QueryFunctionContext,
  QueryKey,
} from './types'
import type { FetchSignalContext } from './utils'

type StreamedQueryParams<TQueryFnData, TData, TQueryKey extends QueryKey> =
  | SimpleStreamedQueryParams<TQueryFnData, TQueryKey>
  | ReducibleStreamedQueryParams<TQueryFnData, TData, TQueryKey>

type SimpleStreamedQueryParams<
  TQueryFnData,
  TQueryKey extends QueryKey,
> = BaseStreamedQueryParams<TQueryFnData, TQueryKey> & {
  reducer?: never
  initialValue?: never
}

type ReducibleStreamedQueryParams<
  TQueryFnData,
  TData,
  TQueryKey extends QueryKey,
> = BaseStreamedQueryParams<TQueryFnData, TQueryKey> & {
  /**
   * Combines the accumulated data with the next chunk. Provide `initialValue` with a custom reducer.
   */
  reducer: (acc: TData, chunk: TQueryFnData) => TData
  /**
   * The starting value for the reducer when there is no cached data or when
   * `refetchMode` is `'replace'` during a refetch.
   */
  initialValue: TData
}

type BaseStreamedQueryParams<TQueryFnData, TQueryKey extends QueryKey> = {
  /** Returns an `AsyncIterable` or a promise that resolves to one. */
  streamFn: (
    context: QueryFunctionContext<TQueryKey>,
  ) => AsyncIterable<TQueryFnData> | Promise<AsyncIterable<TQueryFnData>>
  /**
   * Defines how refetches are handled.
   * - `'reset'` (default): resets the query to its initial state before reading the stream.
   * - `'append'`: appends new data to the existing data.
   * - `'replace'`: writes all data to the cache once the stream ends.
   */
  refetchMode?: 'append' | 'reset' | 'replace'
}

/**
 * Creates a query function that streams data from an `AsyncIterable`.
 * By default, the query collects chunks into an array in the order they arrive.
 * If there is no cached data, the first chunk moves the query from `pending` to `success`.
 * If the stream ends without producing any chunks, the query uses the cached data or
 * the initial value. With a `'replace'` refetch, it uses the initial value.
 * The query's `fetchStatus` stays `fetching` while the stream is active.
 * Explicit cancellation stops further cache updates, even if `streamFn` does not read `signal`.
 * If `streamFn` does not read `signal`, the stream continues after the last observer unsubscribes.
 * @param options - The `streamFn` that returns an AsyncIterable to stream data from, and the optional
 * `refetchMode`, `reducer`, and `initialValue` options.
 * @returns A query function to pass as `queryFn`.
 * @example
 * ```ts
 * await query(queryClient, {
 *   queryKey: ['data'],
 *   queryFn: streamedQuery({
 *     streamFn: fetchDataInChunks,
 *   }),
 * })
 * ```
 */
export function streamedQuery<
  TQueryFnData = unknown,
  TData = Array<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
>({
  streamFn,
  refetchMode = 'reset',
  reducer = (items, chunk) =>
    [...(items as Array<TQueryFnData>), chunk] as TData,
  initialValue = [] as TData,
}: StreamedQueryParams<TQueryFnData, TData, TQueryKey>): QueryFunction<
  TData,
  TQueryKey
> {
  return async (context) => {
    const { client, queryKey } = context
    const signalContext: FetchSignalContext = context
    const signal = signalContext[fetchSignal]
    if (signal?.aborted) return initialValue

    const query = findCachedQuery(getQueryCache(client), { queryKey })
    const isRefetch = !!query && isQueryFetched(query)
    if (isRefetch && refetchMode === 'reset') {
      query.setState({
        ...query.resetState,
        fetchStatus: 'fetching',
      })
    }

    let result = initialValue

    let cancelled = false as boolean
    const streamFnContext = addConsumeAwareSignal<
      OmitKeyof<typeof context, 'signal'>
    >(
      {
        client,
        meta: context.meta,
        queryKey,
        pageParam: context.pageParam,
      },
      () => context.signal,
      () => (cancelled = true),
      signal,
    )

    const isStreamInactive = () => cancelled || signal?.aborted === true
    const stream = await streamFn(streamFnContext)

    const isReplaceRefetch = isRefetch && refetchMode === 'replace'

    for await (const chunk of stream) {
      if (isStreamInactive()) {
        break
      }

      if (isReplaceRefetch) {
        // don't append to the cache directly when replace-refetching
        result = reducer(result, chunk)
      } else {
        setQueryData<TData>(client, queryKey, (prev) =>
          reducer(prev === undefined ? initialValue : prev, chunk),
        )
      }
    }

    // finalize result: replace-refetching needs to write to the cache
    if (isReplaceRefetch && !isStreamInactive()) {
      setQueryData<TData>(client, queryKey, result)
    }

    const data = getQueryData<TData>(client, queryKey)
    return data === undefined ? initialValue : data
  }
}
