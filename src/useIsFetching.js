import React from 'react'

import { queryCache } from './queryCache'

export function useIsFetching() {
  const [state, setState] = React.useState(false)

  React.useEffect(() => {
    return queryCache.subscribe((cache) => setState(Boolean(cache.isFetching)))
  }, [])

  return React.useMemo(() => state && Boolean(cache.isFetching), [state])
}
