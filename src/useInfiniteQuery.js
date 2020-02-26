import React from 'react'

//

import { useBaseQuery } from './useBaseQuery'
import { getQueryArgs, useGetLatest } from './utils'

export function useInfiniteQuery(...args) {
  const queryInfoRef = React.useRef()
  let [queryKey, queryVariables, queryFn, config = {}] = getQueryArgs(args)

  const { getFetchMore } = config
  const getGetFetchMore = useGetLatest(getFetchMore)

  // The default queryFn will query all pages and map them together
  const originalQueryFn = queryFn

  queryFn = async () => {
    const data = await Promise.all(
      queryInfoRef.current.query.pageVariables.map(args =>
        originalQueryFn(...args)
      )
    )
    queryInfoRef.current.query.canFetchMore = getGetFetchMore()(
      data[data.length - 1],
      data
    )
    return data
  }

  const queryInfo = useBaseQuery(queryKey, queryVariables, queryFn, config)
  queryInfoRef.current = queryInfo

  let {
    refetch,
    data = [],
    query: { canFetchMore },
  } = queryInfo

  // Here we seed the pageVariabes for the query
  if (!queryInfo.query.pageVariables) {
    queryInfo.query.pageVariables = [
      [...queryInfo.query.queryKey, ...queryInfo.query.queryVariables],
    ]
  }

  const fetchMore = React.useCallback(
    (fetchMoreInfo = queryInfoRef.current.query.canFetchMore) => {
      refetch({
        __queryFn: async (...args) => {
          try {
            queryInfoRef.current.query.isFetchingMore = true
            const newArgs = [...args, fetchMoreInfo]
            queryInfoRef.current.query.pageVariables.push(newArgs)
            const data = [
              ...queryInfoRef.current.data,
              await originalQueryFn(...newArgs),
            ]
            queryInfoRef.current.query.canFetchMore = getGetFetchMore()(
              data[data.length - 1],
              data
            )
            return data
          } finally {
            queryInfoRef.current.query.isFetchingMore = false
          }
        },
      })
    },
    [getGetFetchMore, originalQueryFn, refetch]
  )

  const isFetchingMore = React.useMemo(() => {
    return !!queryInfo.query.isFetchingMore
  }, [queryInfo.query.isFetchingMore])

  return {
    ...queryInfo,
    data,
    canFetchMore,
    fetchMore,
    isFetchingMore,
  }
}
