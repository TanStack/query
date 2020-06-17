import React from 'react'

//

import { useQueryCache } from './queryCache'
import { useConfigContext } from './config'
import {
  useUid,
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
      query.refetch().catch(Console.error)
    }

    query.wasPrefetched = false
    query.wasSuspended = false
  }, [getLatestConfig, query])

  // Save the refetch interval requested by this instance in the shared query object.
  React.useEffect(() => {
    query.setRefetchInterval(instanceId, config.refetchInterval);
  }, [instanceId, query, config.refetchInterval]);

  // Save the background fetching preferences of this instance in the shared query object.
  React.useEffect(() => {
    query.setRefetchInBackground(instanceId, config.refetchIntervalInBackground);
  }, [instanceId, query, config.refetchIntervalInBackground]);

  return {
    ...query.state,
    config,
    query,
    refetch: query.refetch,
  }
}
