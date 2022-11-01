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
 * @param {boolean} beautify Formats json to multiline
 */
export const displayValue = (value: unknown, beautify: boolean = false) => {
  const { json } = SuperJSON.serialize(value)

  return JSON.stringify(json, null, beautify ? 2 : undefined)
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

export const minPanelSize = 70
export const defaultPanelSize = 500
export const sides: Record<Side, Side> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type Side = 'left' | 'right' | 'top' | 'bottom'
/**
 * Check if the given side is vertical (left/right)
 */
export function isVerticalSide(side: Side) {
  return ['left', 'right'].includes(side)
}
/**
 * Get the opposite side, eg 'left' => 'right'. 'top' => 'bottom', etc
 */
export function getOppositeSide(side: Side): Side {
  return sides[side]
}
/**
 * Given as css prop it will return a sided css prop based on a given side
 * Example given `border` and `right` it return `borderRight`
 */
export function getSidedProp<T extends string>(prop: T, side: Side) {
  return `${prop}${
    side.charAt(0).toUpperCase() + side.slice(1)
  }` as `${T}${Capitalize<Side>}`
}

export interface SidePanelStyleOptions {
  /**
   * Position of the panel
   * Defaults to 'bottom'
   */
  position?: Side
  /**
   * Staring height for the panel, it is set if the position is horizontal eg 'top' or 'bottom'
   * Defaults to 500
   */
  height?: number
  /**
   * Staring width for the panel, it is set if the position is vertical eg 'left' or 'right'
   * Defaults to 500
   */
  width?: number
  /**
   * RQ devtools theme
   */
  devtoolsTheme: Theme
  /**
   * Sets the correct transition and visibility styles
   */
  isOpen?: boolean
  /**
   * If the panel is resizing set to true to apply the correct transition styles
   */
  isResizing?: boolean
  /**
   * Extra panel style passed by the user
   */
  panelStyle?: React.CSSProperties
}

export function getSidePanelStyle({
  position = 'bottom',
  height,
  width,
  devtoolsTheme,
  isOpen,
  isResizing,
  panelStyle,
}: SidePanelStyleOptions): React.CSSProperties {
  const oppositeSide = getOppositeSide(position)
  const borderSide = getSidedProp('border', oppositeSide)
  const isVertical = isVerticalSide(position)

  return {
    ...panelStyle,
    direction: 'ltr',
    position: 'fixed',
    [position]: 0,
    [borderSide]: `1px solid ${devtoolsTheme.gray}`,
    transformOrigin: oppositeSide,
    boxShadow: '0 0 20px rgba(0,0,0,.3)',
    zIndex: 99999,
    // visibility will be toggled after transitions, but set initial state here
    visibility: isOpen ? 'visible' : 'hidden',
    ...(isResizing
      ? {
          transition: `none`,
        }
      : { transition: `all .2s ease` }),
    ...(isOpen
      ? {
          opacity: 1,
          pointerEvents: 'all',
          transform: isVertical
            ? `translateX(0) scale(1)`
            : `translateY(0) scale(1)`,
        }
      : {
          opacity: 0,
          pointerEvents: 'none',
          transform: isVertical
            ? `translateX(15px) scale(1.02)`
            : `translateY(15px) scale(1.02)`,
        }),
    ...(isVertical
      ? {
          top: 0,
          height: '100vh',
          maxWidth: '90%',
          width:
            typeof width === 'number' && width >= minPanelSize
              ? width
              : defaultPanelSize,
        }
      : {
          left: 0,
          width: '100%',
          maxHeight: '90%',
          height:
            typeof height === 'number' && height >= minPanelSize
              ? height
              : defaultPanelSize,
        }),
  }
}

/**
 * Get resize handle style based on a given side
 */
export function getResizeHandleStyle(
  position: Side = 'bottom',
): React.CSSProperties {
  const isVertical = isVerticalSide(position)
  const oppositeSide = getOppositeSide(position)
  const marginSide = getSidedProp('margin', oppositeSide)

  return {
    position: 'absolute',
    cursor: isVertical ? 'col-resize' : 'row-resize',
    zIndex: 100000,
    [oppositeSide]: 0,
    [marginSide]: `-4px`,
    ...(isVertical
      ? {
          top: 0,
          height: '100%',
          width: '4px',
        }
      : {
          width: '100%',
          height: '4px',
        }),
  }
}
