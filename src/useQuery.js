import React from 'react'

//

import {
  useConfigContext,
  uid,
  queries,
  isServer,
  isDocumentVisible,
  Console,
  useGetLatest,
} from './utils'
import { makeQuery } from './makeQuery'

export function useQuery(queryKey, queryFn, config = {}) {
  const isMountedRef = React.useRef(false)
  const wasSuspendedRef = React.useRef(false)
  const instanceIdRef = React.useRef(uid())
  const instanceId = instanceIdRef.current

  config = {
    ...useConfigContext(),
    ...config,
  }

  const { manual } = config

  const [
    queryHash,
    queryGroup,
    variablesHash,
    variables,
  ] = config.queryKeySerializerFn(queryKey)

  let query = queries.find(query => query.queryHash === queryHash)

  let wasPrefetched

  if (query) {
    wasPrefetched = query.config.prefetch
    query.config = config
    if (!isMountedRef.current) {
      query.config.prefetch = wasPrefetched
    }
    query.queryFn = queryFn
  } else {
    query = makeQuery({
      queryHash,
      queryGroup,
      variablesHash,
      variables,
      config,
      queryFn,
    })
    if (!isServer) {
      queries.push(query)
    }
  }

  React.useEffect(() => {
    if (config.refetchInterval && !query.refetchInterval) {
      query.refetchInterval = setInterval(() => {
        if (isDocumentVisible() || config.refetchIntervalInBackground) {
          try {
            query.fetch()
          } catch (err) {
            Console.error(err)
            // Swallow this error, since it is handled elsewhere
          }
        }
      }, config.refetchInterval)

      return () => {
        clearInterval(query.refetchInterval)
        query.refetchInterval = null
      }
    }
  }, [config.refetchInterval, config.refetchIntervalInBackground, query])

  const [state, setState] = React.useState(query.state)

  const onStateUpdate = React.useCallback(newState => setState(newState), [])
  const getLatestOnError = useGetLatest(config.onError)
  const getLatestOnSuccess = useGetLatest(config.onSuccess)
  const getLatestManual = useGetLatest(manual)

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
      onStateUpdate,
      onSuccess: data => getLatestOnSuccess() && getLatestOnSuccess()(data),
      onError: err => getLatestOnError() && getLatestOnError()(err),
    })
    return unsubscribeFromQuery
  }, [getLatestOnError, getLatestOnSuccess, instanceId, onStateUpdate, query])

  React.useEffect(() => {
    if (getLatestManual()) {
      return
    }

    if (config.suspense) {
      if (wasSuspendedRef.current || wasPrefetched) {
        return
      }
    }

    const runRefetch = async () => {
      try {
        await query.fetch()
      } catch (err) {
        Console.error(err)
        // Swallow this error. Don't rethrow it into a render function
      }
    }

    runRefetch()
  }, [config.suspense, getLatestManual, query, wasPrefetched])

  React.useEffect(() => {
    isMountedRef.current = true
  }, [])

  if (config.suspense) {
    if (state.error) {
      throw state.error
    }
    if (!state.isCached) {
      wasSuspendedRef.current = true
      throw query.fetch()
    }
  }

  wasSuspendedRef.current = false

  return {
    ...state,
    refetch,
    fetchMore,
    setData,
  }
}
