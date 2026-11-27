import { addConsumeAwareSignal, fetchSignal } from './utils'
import type * as Shared from '@tanstack/query-types/bindings'
import type { QueryRuntime } from './runtimeBinding'
import type { OmitKeyof, QueryFunction, QueryKey } from './types'
import type { FetchSignalContext } from './utils'

type StreamedQueryParams<
  TQueryFnData,
  TData,
  TQueryKey extends QueryKey,
> = Shared.StreamedQueryParams<QueryRuntime, TQueryFnData, TData, TQueryKey>

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
 * await queryClient.query({
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
    const signalContext: FetchSignalContext = context
    const signal = signalContext[fetchSignal]
    if (signal?.aborted) {
      return initialValue
    }

    const query = context.client
      .getQueryCache()
      .find({ queryKey: context.queryKey, exact: true })
    const isRefetch = !!query && query.isFetched()
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
        client: context.client,
        meta: context.meta,
        queryKey: context.queryKey,
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
        context.client.setQueryData<TData>(context.queryKey, (prev) =>
          reducer(prev === undefined ? initialValue : prev, chunk),
        )
      }
    }

    // finalize result: replace-refetching needs to write to the cache
    if (isReplaceRefetch && !isStreamInactive()) {
      context.client.setQueryData<TData>(context.queryKey, result)
    }

    const data = context.client.getQueryData<TData>(context.queryKey)
    return data === undefined ? initialValue : data
  }
}
