import React from 'react'

//

import { useQueryCache } from './ReactQueryCacheProvider'
import { useMountedCallback } from './utils'

export function useBaseQuery(queryKey, config = {}) {
  // Make a rerender function
  const rerender = useMountedCallback(React.useState()[1])

  // Get the query cache
  const queryCache = useQueryCache()

  // Build the query for use
  const query = queryCache.buildQuery(queryKey, config)

  // Create a query instance ref
  const instanceRef = React.useRef()

  // Subscribe to the query when the subscribe function changes
  React.useEffect(() => {
    instanceRef.current = query.subscribe(() => rerender({}))

    // Unsubscribe when things change
    return instanceRef.current.unsubscribe
  }, [query, rerender])

  // Always update the config
  React.useEffect(() => {
    instanceRef.current.updateConfig(config)
  })

  // Run the instance when the query or enabled change
  React.useEffect(() => {
    if (config.enabled && query) {
      // Just for change detection
    }
    instanceRef.current.run()
  }, [config.enabled, query])

  return {
    ...query,
    ...query.state,
    query,
  }
}
