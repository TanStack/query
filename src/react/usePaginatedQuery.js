import React from 'react'

//

import { useBaseQuery } from './useBaseQuery'
import { useQueryArgs, handleSuspense } from './utils'
import { getStatusBools } from '../core/utils'

// A paginated query is more like a "lag" query, which means
// as the query key changes, we keep the results from the
// last query and use them as placeholder data in the next one
// We DON'T use it as initial data though. That's important
export function usePaginatedQuery(...args) {
  let [queryKey, config = {}] = useQueryArgs(args)

  // Keep track of the latest data result
  const lastDataRef = React.useRef()

  // If latestData is there, don't use initialData
  if (typeof lastDataRef.current !== 'undefined') {
    delete config.initialData
  }

  // Make the query as normal
  const queryInfo = useBaseQuery(queryKey, config)

  // If the query is disabled, get rid of the latest data
  if (!queryInfo.query.config.enabled) {
    lastDataRef.current = undefined
  }

  // Get the real data and status from the query
  let { data: latestData, status } = queryInfo

  // If the real query succeeds, and there is data in it,
  // update the latest data
  React.useEffect(() => {
    if (status === 'success' && typeof latestData !== 'undefined') {
      lastDataRef.current = latestData
    }
  }, [latestData, status])

  // Resolved data should be either the real data we're waiting on
  // or the latest placeholder data
  let resolvedData = latestData
  if (typeof resolvedData === 'undefined') {
    resolvedData = lastDataRef.current
  }

  // If we have any data at all from either, we
  // need to make sure the status is success, even though
  // the real query may still be loading
  if (typeof resolvedData !== 'undefined') {
    const overrides = { status: 'success', ...getStatusBools('success') }
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
