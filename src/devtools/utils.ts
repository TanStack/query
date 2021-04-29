// @ts-nocheck

import React from 'react'

import { useTheme } from './theme'
import useMediaQuery from './useMediaQuery'

export const isServer = typeof window === 'undefined'

export function getQueryStatusColor(query, theme) {
  return query.state.isFetching
    ? theme.active
    : query.isStale()
    ? theme.warning
    : !query.getObserversCount()
    ? theme.gray
    : theme.success
}

export function getQueryStatusLabel(query) {
  return query.state.isFetching
    ? 'fetching'
    : !query.getObserversCount()
    ? 'inactive'
    : query.isStale()
    ? 'stale'
    : 'fresh'
}

export function styled(type, newStyles, queries = {}) {
  return React.forwardRef(({ style, ...rest }, ref) => {
    const theme = useTheme()

    const mediaStyles = Object.entries(queries).reduce(
      (current, [key, value]) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useMediaQuery(key)
          ? {
              ...current,
              ...(typeof value === 'function' ? value(rest, theme) : value),
            }
          : current
      },
      {}
    )

    return React.createElement(type, {
      ...rest,
      style: {
        ...(typeof newStyles === 'function'
          ? newStyles(rest, theme)
          : newStyles),
        ...style,
        ...mediaStyles,
      },
      ref,
    })
  })
}

function useIsMounted() {
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

/**
 * This hook is a safe useState version which schedules state updates in microtasks
 * to prevent updating a component state while React is rendering different components
 * or when the component is not mounted anymore.
 */
export function useSafeState(initialState) {
  const isMounted = useIsMounted()
  const [state, setState] = React.useState(initialState)

  const safeSetState = React.useCallback(
    value => {
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

/**
 * Schedules a microtask.
 * This can be useful to schedule state updates after rendering.
 */
function scheduleMicrotask(callback) {
  Promise.resolve()
    .then(callback)
    .catch(error =>
      setTimeout(() => {
        throw error
      })
    )
}
