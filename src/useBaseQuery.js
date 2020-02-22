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

  const [queryState, setQueryState] = React.useState(query.state)

  const getLatestConfig = useGetLatest(config)

  const refetch = React.useCallback(
    options => {
      if (query.state.isStale) {
        query.fetch(options)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, ...queryVariables]
  )

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

  React.useEffect(() => {
    const unsubscribeFromQuery = query.subscribe({
      id: instanceId,
      onStateUpdate: newState => setQueryState(newState),
      onSuccess: data => getLatestConfig().onSuccess(data),
      onError: err => getLatestConfig().onError(err),
      onSettled: (data, err) => getLatestConfig().onSettled(data, err),
    })
    return unsubscribeFromQuery
  }, [getLatestConfig, instanceId, query])

  React.useEffect(() => {
    if (getLatestConfig().manual) {
      return
    }

    refetch().catch(Console.error)
  }, [config.suspense, getLatestConfig, refetch])

  if (config.suspense) {
    if (queryState.status === statusError) {
      throw queryState.error
    }
    if (queryState.status === statusLoading) {
      throw refetch()
    }
  }

  return {
    ...queryState,
    query,
    refetch,
  }
}
