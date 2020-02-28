import React from 'react'

//

import { useBaseQuery } from './useBaseQuery'
import { getQueryArgs } from './utils'

export function usePaginatedQuery(...args) {
  let [queryKey, queryVariables, queryFn, config = {}] = getQueryArgs(args)

  const lastDataRef = React.useRef()

  // If latestData is set, don't use initialData
  if (typeof lastDataRef.current !== 'undefined') {
    delete config.initialData
  }

  const queryInfo = useBaseQuery(queryKey, queryVariables, queryFn, config)

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
    status = 'success'
  }

  return {
    ...queryInfo,
    resolvedData,
    latestData,
    status,
  }
}
