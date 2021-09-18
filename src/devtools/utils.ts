import React from 'react'
import { Query } from '../core'

import { Theme, useTheme } from './theme'
import useMediaQuery from './useMediaQuery'

export const isServer = typeof window === 'undefined'

type StyledComponent<T> = T extends 'button'
  ? React.DetailedHTMLProps<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >
  : T extends 'input'
  ? React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
    >
  : T extends 'select'
  ? React.DetailedHTMLProps<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      HTMLSelectElement
    >
  : T extends keyof HTMLElementTagNameMap
  ? React.HTMLAttributes<HTMLElementTagNameMap[T]>
  : never

export function getQueryStatusColor(query: Query, theme: Theme) {
  return query.state.isFetching
    ? theme.active
    : !query.getObserversCount()
    ? theme.gray
    : query.isStale()
    ? theme.warning
    : theme.success
}

export function getQueryStatusLabel(query: Query) {
  return query.state.isFetching
    ? 'fetching'
    : !query.getObserversCount()
    ? 'inactive'
    : query.isStale()
    ? 'stale'
    : 'fresh'
}

type Styles =
  | React.CSSProperties
  | ((props: Record<string, any>, theme: Theme) => React.CSSProperties)

export function styled<T extends keyof HTMLElementTagNameMap>(
  type: T,
  newStyles: Styles,
  queries: Record<string, Styles> = {}
) {
  return React.forwardRef<HTMLElementTagNameMap[T], StyledComponent<T>>(
    ({ style, ...rest }, ref) => {
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
    }
  )
}

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

/**
 * This hook is a safe useState version which schedules state updates in microtasks
 * to prevent updating a component state while React is rendering different components
 * or when the component is not mounted anymore.
 */
export function useSafeState<T>(initialState: T): [T, (value: T) => void] {
  const isMounted = useIsMounted()
  const [state, setState] = React.useState(initialState)

  const safeSetState = React.useCallback(
    (value: T) => {
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
function scheduleMicrotask(callback: () => void) {
  Promise.resolve()
    .then(callback)
    .catch(error =>
      setTimeout(() => {
        throw error
      })
    )
}
