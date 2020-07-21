import React from 'react'

//

import { useQueryCache } from './ReactQueryCacheProvider'
import { useRerenderer } from './utils'

export function useBaseQuery(queryKey, config = {}) {
  // Make a rerender function
  const rerender = useRerenderer()

  // Get the query cache
  const queryCache = useQueryCache()

  // Build the query for use
  const query = queryCache.buildQuery(queryKey, config)

  // Create a query instance ref
  const instanceRef = React.useRef()

  // Subscribe to the query when the subscribe function changes
  React.useEffect(() => {
    instanceRef.current = query.subscribe(() => {
      rerender()
    })

    // Unsubscribe when things change
    return instanceRef.current.unsubscribe
  }, [query, rerender])

  // Always update the config
  React.useEffect(() => {
    instanceRef.current.updateConfig(config)
  })

  const enabledBool = Boolean(config.enabled)

  // Run the instance when the query or enabled change
  React.useEffect(() => {
    if (enabledBool && query) {
      // Just for change detection
    }
    instanceRef.current.run()
  }, [enabledBool, query])

  return {
    ...query,
    ...query.state,
    query,
  }
}
