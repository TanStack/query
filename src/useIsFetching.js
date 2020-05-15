import React from 'react'

import { useQueryCache } from './queryCache'

export function useIsFetching() {
  const queryCache = useQueryCache()
  const [state, setState] = React.useState({})

  React.useEffect(() => {
    return queryCache.subscribe(() => setState({}))
  }, [])

  return React.useMemo(() => state && queryCache.isFetching, [state])
}
