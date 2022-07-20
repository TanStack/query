import * as React from 'react'
import type { Query } from '@tanstack/react-query'

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

export function getQueryStatusColor({
  queryState,
  observerCount,
  isStale,
  theme,
}: {
  queryState: Query['state']
  observerCount: number
  isStale: boolean
  theme: Theme
}) {
  return queryState.fetchStatus === 'fetching'
    ? theme.active
    : !observerCount
    ? theme.gray
    : queryState.fetchStatus === 'paused'
    ? theme.paused
    : isStale
    ? theme.warning
    : theme.success
}

export function getQueryStatusLabel(query: Query) {
  return query.state.fetchStatus === 'fetching'
    ? 'fetching'
    : !query.getObserversCount()
    ? 'inactive'
    : query.state.fetchStatus === 'paused'
    ? 'paused'
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
  queries: Record<string, Styles> = {},
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
        {},
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
    },
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
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 */
export const displayValue = (value: unknown) => {
  const name = Object.getOwnPropertyNames(Object(value))
  const newValue = typeof value === 'bigint' ? `${value.toString()}n` : value

  return JSON.stringify(newValue, name)
}

const getStatusRank = (q: Query) =>
  q.state.fetchStatus !== 'idle'
    ? 0
    : !q.getObserversCount()
    ? 3
    : q.isStale()
    ? 2
    : 1

export const sortFns: Record<string, (a: Query, b: Query) => number> = {
  'Status > Last Updated': (a, b) =>
    getStatusRank(a) === getStatusRank(b)
      ? (sortFns['Last Updated']?.(a, b) as number)
      : getStatusRank(a) > getStatusRank(b)
      ? 1
      : -1,
  'Query Hash': (a, b) => (a.queryHash > b.queryHash ? 1 : -1),
  'Last Updated': (a, b) =>
    a.state.dataUpdatedAt < b.state.dataUpdatedAt ? 1 : -1,
}
