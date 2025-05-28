import { addToEnd } from './utils'
import type { QueryFunction, QueryFunctionContext, QueryKey } from './types'

/**
 * This is a helper function to create a query function that streams data from an AsyncIterable.
 * Data will be an Array of all the chunks received.
 * The query will be in a 'pending' state until the first chunk of data is received, but will go to 'success' after that.
 * The query will stay in fetchStatus 'fetching' until the stream ends.
 * @param queryFn - The function that returns an AsyncIterable to stream data from.
 * @param refetchMode - Defines how re-fetches are handled.
 * Defaults to `'reset'`, erases all data and puts the query back into `pending` state.
 * Set to `'append'` to append new data to the existing data.
 * Set to `'replace'` to write all data to the cache once the stream ends.
 * @param maxChunks - The maximum number of chunks to keep in the cache.
 * Defaults to `undefined`, meaning all chunks will be kept.
 * If `undefined` or `0`, the number of chunks is unlimited.
 * If the number of chunks exceeds this number, the oldest chunk will be removed.
 */
export function streamedQuery<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
>({
  queryFn,
  refetchMode = 'reset',
  maxChunks,
}: {
  queryFn: (
    context: QueryFunctionContext<TQueryKey>,
  ) => AsyncIterable<TQueryFnData> | Promise<AsyncIterable<TQueryFnData>>
  refetchMode?: 'append' | 'reset' | 'replace'
  maxChunks?: number
}): QueryFunction<Array<TQueryFnData>, TQueryKey> {
  return async (context) => {
    const query = context.client
      .getQueryCache()
      .find({ queryKey: context.queryKey, exact: true })
    const isRefetch = !!query && query.state.data !== undefined

    if (isRefetch && refetchMode === 'reset') {
      query.setState({
        status: 'pending',
        data: undefined,
        error: null,
        fetchStatus: 'fetching',
      })
    }

    let result: Array<TQueryFnData> = []
    const stream = await queryFn(context)

    for await (const chunk of stream) {
      if (context.signal.aborted) {
        break
      }

      // don't append to the cache directly when replace-refetching
      if (!isRefetch || refetchMode !== 'replace') {
        context.client.setQueryData<Array<TQueryFnData>>(
          context.queryKey,
          (prev = []) => {
            return addToEnd(prev, chunk, maxChunks)
          },
        )
      }
      result = addToEnd(result, chunk, maxChunks)
    }

    // finalize result: replace-refetching needs to write to the cache
    if (isRefetch && refetchMode === 'replace' && !context.signal.aborted) {
      context.client.setQueryData<Array<TQueryFnData>>(context.queryKey, result)
    }

    return context.client.getQueryData(context.queryKey)!
  }
}
