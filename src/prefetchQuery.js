import { queries, defaultConfigRef, isServer, uid, noop } from './utils'

import { makeQuery } from './makeQuery'

export async function prefetchQuery(queryKey, queryFn, config = {}) {
  config = {
    ...defaultConfigRef.current,
    ...config,
    prefetch: true,
  }

  const [
    queryHash,
    queryGroup,
    variablesHash,
    variables,
  ] = config.queryKeySerializerFn(queryKey)

  // If we're prefetching, use the queryFn to make the fetch call

  let query = queries.find(query => query.queryHash === queryHash)

  if (query) {
    if (!config.force) {
      return
    }
    query.config = config
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

  // Trigger a query subscription with one-time unique id
  const unsubscribeFromQuery = query.subscribe({
    id: uid(),
    onStateUpdate: noop,
  })

  // Trigger a fetch and return the promise
  try {
    return await query.fetch({ force: config.force })
  } finally {
    // Since this is not a hook, upsubscribe after we're done
    unsubscribeFromQuery()
  }
}
