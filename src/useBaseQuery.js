import React from 'react'

//

import { queryCache } from './queryCache'
import { useConfigContext } from './config'
import {
  useUid,
  isDocumentVisible,
  Console,
  useGetLatest,
  statusError,
  statusLoading,
} from './utils'

export function useBaseQuery(queryKey, queryVariables, queryFn, config = {}) {
  const instanceId = useUid()

  config = {
    ...useConfigContext(),
    ...config,
  }

  let query = queryCache._buildQuery(queryKey, queryVariables, queryFn, config)

  const rerender = React.useState(null)[1]
  const isMountedRef = React.useRef(false)
  const getLatestConfig = useGetLatest(config)
  const refetch = React.useCallback(query.fetch, [query])

  // Subscribe to the query and maybe trigger fetch
  React.useEffect(() => {
    const unsubscribeFromQuery = query.subscribe({
      id: instanceId,
      onStateUpdate: newState => rerender({}),
      onSuccess: data => getLatestConfig().onSuccess(data),
      onError: err => getLatestConfig().onError(err),
      onSettled: (data, err) => getLatestConfig().onSettled(data, err),
    })

    // Perform the initial fetch for this query if necessary
    if (
      !query.wasSuspensed && // Don't double fetch for suspense
      query.state.isStale && // Only refetch if stale
      // Either first instance or
      (query.instances.length === 1 ||
        // refetchOnMount is true
        getLatestConfig().refetchOnMount)
    ) {
      refetch().catch(Console.error)
    }

    query.wasSuspensed = false

    return unsubscribeFromQuery
  }, [getLatestConfig, instanceId, query, refetch, rerender])

  // Handle refetch interval
  React.useEffect(() => {
    if (
      config.refetchInterval &&
      (!query.refetchInterval || config.refetchInterval < query.refetchInterval)
    ) {
      clearInterval(query.refetchInterval)
      query.refetchInterval = setInterval(() => {
        if (isDocumentVisible() || config.refetchIntervalInBackground) {
          refetch().catch(Console.error)
        }
      }, config.refetchInterval)

      return () => {
        clearInterval(query.refetchInterval)
        delete query.refetchInterval
      }
    }
  }, [
    config.refetchInterval,
    config.refetchIntervalInBackground,
    query.refetchInterval,
    refetch,
  ])

  // // After initial mount, refetch if queryVariables are present and change
  // React.useEffect(() => {
  //   if (
  //     isMountedRef.current && // Must be subscribed
  //     !wasSuspenseRef.current && // Dont' double fetch suspense
  //     queryVariables.length // Must have queryVariables
  //   ) {
  //     refetch().catch(Console.error)
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [refetch, ...queryVariables])

  // Reset refs
  React.useEffect(() => {
    isMountedRef.current = true
  })

  if (config.suspense) {
    if (query.state.status === statusError) {
      throw query.state.error
    }
    if (query.state.status === statusLoading) {
      query.wasSuspensed = true
      throw refetch()
    }
  }

  return {
    ...query.state,
    query,
    refetch,
  }
}
