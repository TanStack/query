import React from 'react'

import { isServer } from '../core/utils'

function useIsMounted(): () => boolean {
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

/**
 * This hook is a safe useState version which schedules state updates in microtasks
 * to prevent updating a component state while React is rendering different components
 * or when the component is not mounted anymore.
 */
export function useSafeState<S>(
  initialState: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>] {
  const isMounted = useIsMounted()
  const [state, setState] = React.useState(initialState)

  const safeSetState = React.useCallback(
    (value: React.SetStateAction<S>) => {
      scheduleMicrotask(() => {
        if (isMounted()) {
          setState(value)
        }
      })
    },
    [isMounted]
  )

  return [state, safeSetState]
}

export function useRerenderer() {
  const [, setState] = useSafeState({})
  return React.useCallback(() => setState({}), [setState])
}

/**
 * Schedules a microtask.
 * This can be useful to schedule state updates after rendering.
 */
function scheduleMicrotask(callback: () => void): void {
  Promise.resolve()
    .then(callback)
    .catch(error =>
      setTimeout(() => {
        throw error
      })
    )
}
