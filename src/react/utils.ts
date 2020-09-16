import React from 'react'

import { isServer } from '../core/utils'

export function useIsMounted(): () => boolean {
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

export function useMountedCallback<T extends Function>(callback: T): T {
  const isMounted = useIsMounted()
  return (React.useCallback(
    (...args: any[]) => {
      if (isMounted()) {
        return callback(...args)
      }
    },
    [callback, isMounted]
  ) as any) as T
}
