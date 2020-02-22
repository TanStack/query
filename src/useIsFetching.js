import React from 'react'

import { queryCache } from './queryCache'

export function useIsFetching() {
  const [state, setState] = React.useState({})
  const subscriptionRef = React.useRef(queryCache.subscribe(() => setState({})))

  const unsubscribe = subscriptionRef.current

  React.useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return React.useMemo(() => state && queryCache.isFetching, [state])
}
