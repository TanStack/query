import { addToEnd } from './utils'
import type { QueryFunction, QueryFunctionContext, QueryKey } from './types'

type StreamedQueryParams<TQueryFnData, TData, TQueryKey extends QueryKey> = {
  queryFn: (
    context: QueryFunctionContext<TQueryKey>,
  ) => AsyncIterable<TQueryFnData> | Promise<AsyncIterable<TQueryFnData>>
  refetchMode?: 'append' | 'reset' | 'replace'
  reducer?: (acc: TData, chunk: TQueryFnData) => TData
  placeholderData?: TData
}

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
 * @param reducer - A function to reduce the streamed chunks into the final data.
 * Defaults to a function that appends chunks to the end of the array.
 * @param placeholderData - Initial data to be used while the first chunk is being fetched.
 * Defaults to an empty array.
 */
export function streamedQuery<
  TQueryFnData = unknown,
  TData = Array<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
>({
  queryFn,
  refetchMode = 'reset',
  reducer = (items, chunk) => addToEnd((items ?? []) as Array<TQueryFnData>, chunk) as TData,
  placeholderData = [] as TData,
}: StreamedQueryParams<TQueryFnData, TData, TQueryKey>): QueryFunction<TData, TQueryKey> {
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

    let result = placeholderData;

    const stream = await queryFn(context)

    for await (const chunk of stream) {
      if (context.signal.aborted) {
        break
      }
      
      // don't append to the cache directly when replace-refetching
      if (!isRefetch || refetchMode !== 'replace') { 
        context.client.setQueryData<TData>(
          context.queryKey,
          (prev) => reducer(prev ?? placeholderData, chunk)
        )
      }
      result = reducer(result, chunk)
    }

    // finalize result: replace-refetching needs to write to the cache
    if (isRefetch && refetchMode === 'replace' && !context.signal.aborted) {
      context.client.setQueryData<TData>(context.queryKey, result)
    }

    return context.client.getQueryData(context.queryKey)!
  }
}
