import React from 'react'

import { getQueryCache } from './queryCache'

export function useIsFetching() {
  const [state, setState] = React.useState({})
  const subscriptionRef = React.useRef(
    getQueryCache().subscribe(() => setState({}))
  )

  const unsubscribe = subscriptionRef.current

  React.useEffect(() => {
    return () => {
      unsubscribe()
    }
  }, [unsubscribe])

  return React.useMemo(
    () =>
      state &&
      Object.values(getQueryCache().cache).some(
        query => query.state.isFetching
      ),
    [state]
  )
}
