import { getQueryCache } from './queryCache'
import { defaultConfigRef } from './config'
import { uid } from './utils'

export async function prefetchQuery(queryKey, queryFn, config = {}) {
  config = {
    ...defaultConfigRef.current,
    ...config,
    prefetch: true,
  }

  const query = getQueryCache().build({
    queryKey,
  })

  if (!config.force) {
    return
  }
  query.config = config
  query.queryFn = queryFn

  // Trigger a query subscription with one-time unique id
  const unsubscribeFromQuery = query.subscribe({ id: uid() })

  // Trigger a fetch and return the promise
  try {
    return await query.fetch({ force: config.force })
  } finally {
    // Since this is not a hook, upsubscribe right after we're done
    unsubscribeFromQuery()
  }
}
