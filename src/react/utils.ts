import React from 'react'

import { isServer } from '../core/utils'

export function useIsMounted(): () => boolean {
  const mountedRef = React.useRef(false)
  const isMounted = React.useCallback(() => mountedRef.current, [])
  const useEffect = isServer ? React.useEffect : React.useLayoutEffect

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return isMounted
}
