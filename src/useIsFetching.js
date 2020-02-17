import React from 'react'

import { queries, globalStateListeners } from './utils'

export function useIsFetching() {
  const [state, setState] = React.useState({})
  const ref = React.useRef()

  if (!ref.current) {
    ref.current = () => {
      setState({})
    }
    globalStateListeners.push(ref.current)
  }

  React.useEffect(() => {
    return () => {
      globalStateListeners.splice(globalStateListeners.indexOf(ref.current), 1)
    }
  }, [])

  return React.useMemo(
    () => state && queries.some(query => query.state.isFetching),
    [state]
  )
}
