import React from 'react'

import { isServer } from '../core/utils'

export function useIsMounted() {
  const mountedRef = React.useRef(false)
  const isMounted = React.useCallback(() => mountedRef.current, [])

  React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return isMounted
}
