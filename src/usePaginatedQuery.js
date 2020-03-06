import React from 'react'

//

import { useBaseQuery } from './useBaseQuery'
import { getQueryArgs, statusError, statusLoading } from './utils'

export function usePaginatedQuery(...args) {
  let [queryKey, queryVariables, queryFn, config = {}] = getQueryArgs(args)

  const lastDataRef = React.useRef()

  // If latestData is set, don't use initialData
  if (typeof lastDataRef.current !== 'undefined') {
    delete config.initialData
  }

  const query = useBaseQuery(queryKey, queryVariables, queryFn, config)

  let { data: latestData, status } = query

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

  if (query.config.suspense) {
    if (query.status === statusError) {
      throw query.error
    }
    if (query.status === statusLoading) {
      query.wasSuspensed = true
      throw query.refetch()
    }
  }

  return {
    ...query,
    resolvedData,
    latestData,
    status,
  }
}
