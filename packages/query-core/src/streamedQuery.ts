import { noop } from './utils'
import type { QueryFunction, QueryFunctionContext, QueryKey } from './types'

/**
 * This is a helper function to create a query function that streams data from an AsyncIterable.
 * Data will be an Array of all the chunks received.
 * The query will be in a 'pending' state until the first chunk of data is received, but will go to 'success' after that.
 * The query will stay in fetchStatus 'fetching' until the stream ends.
 * @param queryFn - The function that returns an AsyncIterable to stream data from.
 * @param refetchMode - Defaults to 'reset', which replaces data when a refetch happens. Set to 'append' to append new data to the existing data.
 */
export function streamedQuery<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
>({
  queryFn,
  refetchMode = 'reset',
}: {
  queryFn: (
    context: QueryFunctionContext<TQueryKey>,
  ) => AsyncIterable<TQueryFnData> | Promise<AsyncIterable<TQueryFnData>>
  refetchMode?: 'append' | 'reset' | 'replace'
}): QueryFunction<Array<TQueryFnData>, TQueryKey> {
  return (context) => {
    const query = context.client
      .getQueryCache()
      .find({ queryKey: context.queryKey, exact: true })
    const isRefetch = !!query && query.state.data !== undefined

    async function readFromStream(
      onChunk: (chunk: TQueryFnData) => void,
      finalize: () => void,
    ) {
      const stream = await queryFn(context)
      for await (const chunk of stream) {
        if (context.signal.aborted) {
          break
        }
        onChunk(chunk)
      }
      finalize()
      return context.client.getQueryData<Array<TQueryFnData>>(context.queryKey)!
    }

    let onChunk = (chunk: TQueryFnData) => {
      context.client.setQueryData<Array<TQueryFnData>>(
        context.queryKey,
        (prev = []) => {
          return prev.concat([chunk])
        },
      )
    }
    let finalize = noop

    if (isRefetch && refetchMode === 'reset') {
      query.setState({
        status: 'pending',
        data: undefined,
        error: null,
        fetchStatus: 'fetching',
      })
    }
    if (isRefetch && refetchMode === 'replace') {
      const result: Array<TQueryFnData> = []
      onChunk = (chunk) => {
        result.push(chunk)
      }
      finalize = () => {
        console.log('finalize', result)
        context.client.setQueryData<Array<TQueryFnData>>(
          context.queryKey,
          result,
        )
      }
    }

    return readFromStream(onChunk, finalize)
  }
}
