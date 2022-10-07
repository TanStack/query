import * as React from 'react'
import type { Query } from '@tanstack/react-query'
import SuperJSON from 'superjson'

import type { Theme } from './theme'
import { useTheme } from './theme'
import useMediaQuery from './useMediaQuery'

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

  React.useEffect(() => {
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
  const { json } = SuperJSON.serialize(value)

  return JSON.stringify(json)
}

// Sorting functions
type SortFn = (a: Query, b: Query) => number

const getStatusRank = (q: Query) =>
  q.state.fetchStatus !== 'idle'
    ? 0
    : !q.getObserversCount()
    ? 3
    : q.isStale()
    ? 2
    : 1

const queryHashSort: SortFn = (a, b) => a.queryHash.localeCompare(b.queryHash)

const dateSort: SortFn = (a, b) =>
  a.state.dataUpdatedAt < b.state.dataUpdatedAt ? 1 : -1

const statusAndDateSort: SortFn = (a, b) => {
  if (getStatusRank(a) === getStatusRank(b)) {
    return dateSort(a, b)
  }

  return getStatusRank(a) > getStatusRank(b) ? 1 : -1
}

export const sortFns: Record<string, SortFn> = {
  'Status > Last Updated': statusAndDateSort,
  'Query Hash': queryHashSort,
  'Last Updated': dateSort,
}
