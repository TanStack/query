import React from 'react'

//

import { useBaseQuery } from './useBaseQuery'
import { getQueryArgs, handleSuspense } from './utils'

export function usePaginatedQuery(...args) {
  let [queryKey, queryFn, config = {}] = getQueryArgs(args)

  const lastDataRef = React.useRef()

  // If latestData is set, don't use initialData
  if (typeof lastDataRef.current !== 'undefined') {
    delete config.initialData
  }

  const queryInfo = useBaseQuery(queryKey, queryFn, config)

  if (!queryInfo.query.config.enabled) {
    lastDataRef.current = undefined
  }

  let { data: latestData, status } = queryInfo

  React.useEffect(() => {
    if (status === 'success' && typeof latestData !== 'undefined') {
      lastDataRef.current = latestData
    }
  }, [latestData, status])

  let resolvedData = latestData

  if (typeof resolvedData === 'undefined') {
    resolvedData = lastDataRef.current
  }

  if (typeof resolvedData !== 'undefined') {
    const overrides = {
      status: 'success',
      isError: false,
      isLoading: false,
      isSuccess: true,
    }

    Object.assign(queryInfo.query.state, overrides)
    Object.assign(queryInfo, overrides)
  }

  const paginatedQueryInfo = {
    ...queryInfo,
    resolvedData,
    latestData,
  }

  handleSuspense(paginatedQueryInfo)

  return paginatedQueryInfo
}
