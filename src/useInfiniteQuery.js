import React from 'react'

//

import { useBaseQuery } from './useBaseQuery'
import { useQueryArgs, useGetLatest, handleSuspense } from './utils'

export function useInfiniteQuery(...args) {
  const queryInfoRef = React.useRef()
  let [queryKey, config] = useQueryArgs(args)

  const { getFetchMore } = config
  const getGetFetchMore = useGetLatest(getFetchMore)

  // The default queryFn will query all pages and map them together
  const originalQueryFn = config.queryFn

  config.queryFn = async () => {
    const data = []
    const pageVariables = [...queryInfoRef.current.query.pageVariables]
    const rebuiltPageVariables = []

    do {
      const args = pageVariables.shift()

      if (!data.length) {
        // the first page query doesn't need to be rebuilt
        data.push(await originalQueryFn(...args))
        rebuiltPageVariables.push(args)
      } else {
        // get an up-to-date cursor based on the previous data set
        const nextCursor = getGetFetchMore()(data[data.length - 1], data)

        // break early if there's no next cursor
        // otherwise we'll start from the beginning
        // which will cause unwanted duplication
        if (!nextCursor) {
          break
        }

        const pageArgs = [
          // remove the last argument (the previously saved cursor)
          ...args.slice(0, -1),
          nextCursor,
        ]

        data.push(await originalQueryFn(...pageArgs))
        rebuiltPageVariables.push(pageArgs)
      }
    } while (pageVariables.length)

    queryInfoRef.current.query.canFetchMore = getGetFetchMore()(
      data[data.length - 1],
      data
    )
    queryInfoRef.current.query.pageVariables = rebuiltPageVariables

    return data
  }

  const queryInfo = useBaseQuery(queryKey, config)

  if (
    typeof queryInfo.query.canFetchMore === 'undefined' &&
    typeof queryInfo.data !== 'undefined'
  ) {
    queryInfo.query.canFetchMore = getGetFetchMore()(
      queryInfo.data[queryInfo.data.length - 1],
      queryInfo.data
    )
  }

  queryInfoRef.current = queryInfo

  let {
    data = [],
    query: { canFetchMore },
  } = queryInfo

  // Here we seed the pageVariabes for the query
  if (!queryInfo.query.pageVariables) {
    queryInfo.query.pageVariables = [[...queryInfo.query.queryKey]]
  }

  const fetchMore = React.useCallback(
    (
      fetchMoreInfo = queryInfoRef.current.query.canFetchMore,
      { previous = false } = {}
    ) =>
      queryInfoRef.current.query.canFetchMore
        ? queryInfoRef.current.query.fetch({
            queryFn: async (...args) => {
              try {
                queryInfoRef.current.query.setState(old => ({
                  ...old,
                  isFetchingMore: previous ? 'previous' : 'next',
                }))

                const newArgs = previous
                  ? [fetchMoreInfo, ...args]
                  : [...args, fetchMoreInfo]
                queryInfoRef.current.query.pageVariables[
                  previous ? 'unshift' : 'push'
                ](newArgs)

                const newData = await originalQueryFn(...newArgs)

                const data = previous
                  ? [newData, ...queryInfoRef.current.data]
                  : [...queryInfoRef.current.data, newData]

                queryInfoRef.current.query.canFetchMore = getGetFetchMore()(
                  newData,
                  data
                )

                return data
              } finally {
                queryInfoRef.current.query.setState(old => ({
                  ...old,
                  isFetchingMore: false,
                }))
              }
            },
          })
        : void 0,
    [getGetFetchMore, originalQueryFn]
  )

  handleSuspense(queryInfo)

  return {
    ...queryInfo,
    data,
    canFetchMore,
    fetchMore,
  }
}
