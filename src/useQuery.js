import React from 'react'

//

import { getQueryCache } from './queryCache'
import { useConfigContext } from './config'
import {
  useUid,
  isDocumentVisible,
  Console,
  useGetLatest,
  statusError,
  statusLoading,
} from './utils'

export function useQuery(queryKey, queryFn, config = {}) {
  const instanceId = useUid()

  config = {
    ...useConfigContext(),
    ...config,
  }

  let query = getQueryCache().build({
    queryKey,
    config,
    queryFn,
  })

  React.useEffect(() => {
    if (
      config.refetchInterval &&
      (!query.refetchInterval || config.refetchInterval < query.refetchInterval)
    ) {
      clearInterval(query.refetchInterval)
      query.refetchInterval = setInterval(() => {
        if (isDocumentVisible() || config.refetchIntervalInBackground) {
          query.fetch().catch(Console.error)
        }
      }, config.refetchInterval)

      return () => {
        clearInterval(query.refetchInterval)
        delete query.refetchInterval
      }
    }
  }, [config.refetchInterval, config.refetchIntervalInBackground, query])

  const [state, setState] = React.useState(query.state)
  const getLatestConfig = useGetLatest(config)

  const refetch = query.fetch
  const setData = query.setData

  const fetchMore = React.useCallback(
    config.paginated
      ? paginationVariables =>
          query.fetch({
            variables: paginationVariables,
            force: true,
            isFetchMore: true,
          })
      : undefined,
    [query]
  )

  React.useEffect(() => {
    const unsubscribeFromQuery = query.subscribe({
      id: instanceId,
      onStateUpdate: newState => setState(newState),
      onSuccess: data => getLatestConfig().onSuccess(data),
      onError: err => getLatestConfig().onError(err),
    })
    return unsubscribeFromQuery
  }, [getLatestConfig, instanceId, query])

  React.useEffect(() => {
    if (getLatestConfig().manual) {
      return
    }

    query.fetch().catch(Console.error)
  }, [config.suspense, getLatestConfig, query])

  if (config.suspense) {
    if (state.status === statusError) {
      throw state.error
    }
    if (state.status === statusLoading) {
      throw query.fetch()
    }
  }

  return {
    ...state,
    refetch,
    fetchMore,
    setData,
  }
}
