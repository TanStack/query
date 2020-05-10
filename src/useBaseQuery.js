import React from 'react'

//

import { useQueryCache } from './queryCache'
import { useConfigContext } from './config'
import {
  useUid,
  isDocumentVisible,
  Console,
  useGetLatest,
  useMountedCallback,
} from './utils'

export function useBaseQuery(queryKey, queryVariables, queryFn, config = {}) {
  const instanceId = useUid()

  config = {
    ...useConfigContext(),
    ...config,
  }

  const queryCache = useQueryCache()

  const queryRef = React.useRef()

  const newQuery = queryCache._buildQuery(
    queryKey,
    queryVariables,
    queryFn,
    config
  )

  const useCachedQuery =
    queryRef.current &&
    typeof queryRef.current.queryHash === 'undefined' &&
    typeof newQuery.queryHash === 'undefined'

  // Do not use new query with undefined queryHash, if previous query also had undefined queryHash.
  // Otherwise this will cause infinite loop.
  if (!useCachedQuery) {
    queryRef.current = newQuery
  }

  const query = queryRef.current

  const [, unsafeRerender] = React.useState()

  const rerender = useMountedCallback(unsafeRerender)

  const getLatestConfig = useGetLatest(config)
  const refetch = React.useCallback(
    async ({ throwOnError, ...rest } = {}) => {
      try {
        return await query.fetch(rest)
      } catch (err) {
        if (throwOnError) {
          throw err
        }
      }
    },
    [query]
  )

  query.suspenseInstance = {
    onSuccess: data => getLatestConfig().onSuccess(data),
    onError: err => getLatestConfig().onError(err),
    onSettled: (data, err) => getLatestConfig().onSettled(data, err),
  }

  // After mount, subscribe to the query
  React.useEffect(() => {
    // Update the instance to the query again, but not as a placeholder
    query.updateInstance({
      id: instanceId,
      onStateUpdate: () => rerender({}),
      onSuccess: data => getLatestConfig().onSuccess(data),
      onError: err => getLatestConfig().onError(err),
      onSettled: (data, err) => getLatestConfig().onSettled(data, err),
    })

    return query.subscribe(instanceId)
  }, [getLatestConfig, instanceId, query, rerender])

  React.useEffect(() => {
    // Perform the initial fetch for this query if necessary
    if (
      !getLatestConfig().manual && // Don't auto fetch if config is set to manual query
      !query.wasPrefetched && // Don't double fetch for prefetched queries
      !query.wasSuspended && // Don't double fetch for suspense
      query.state.isStale && // Only refetch if stale
      (getLatestConfig().refetchOnMount || query.instances.length === 1)
    ) {
      refetch().catch(Console.error)
    }

    query.wasPrefetched = false
    query.wasSuspended = false
  }, [getLatestConfig, query, refetch])

  // Handle refetch interval
  React.useEffect(() => {
    const query = queryRef.current
    if (
      config.refetchInterval &&
      (!query.currentRefetchInterval ||
        // shorter interval should override previous one
        config.refetchInterval < query.currentRefetchInterval)
    ) {
      query.currentRefetchInterval = config.refetchInterval
      clearInterval(query.refetchIntervalId)
      query.refetchIntervalId = setInterval(() => {
        if (isDocumentVisible() || config.refetchIntervalInBackground) {
          refetch().catch(Console.error)
        }
      }, config.refetchInterval)

      return () => {
        clearInterval(query.refetchIntervalId)
        delete query.refetchIntervalId
        delete query.currentRefetchInterval
      }
    }
  }, [config.refetchInterval, config.refetchIntervalInBackground, refetch])

  return {
    ...query.state,
    config,
    query,
    refetch,
  }
}
