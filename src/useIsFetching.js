import React from 'react'

import { queryCache } from './queryCache'

export function useIsFetching() {
  const [state, setState] = React.useState({})

  React.useEffect(() => {
    return queryCache.subscribe(() => setState({}))
  }, [])

  return React.useMemo(() => state && queryCache.isFetching, [state])
}
