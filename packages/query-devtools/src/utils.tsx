import { serialize } from 'superjson'
import { createSignal, onCleanup, onMount } from 'solid-js'
import type { Mutation, Query } from '@tanstack/query-core'
import type { DevtoolsPosition } from './contexts'

/**
 * Returns the status label of a query: fetching, inactive (no observers), paused, stale, or fresh,
 * checked in that order.
 * @param query - The query to label.
 * @returns One of `'fetching'`, `'inactive'`, `'paused'`, `'stale'`, or `'fresh'`.
 */
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

type QueryStatusLabel = 'fresh' | 'stale' | 'paused' | 'inactive' | 'fetching'

/**
 * Appends a capitalized side to a CSS property name, e.g. `border` and `left` to `borderLeft`.
 * @param prop - The property name.
 * @param side - The side to append.
 * @returns The sided property name.
 */
export function getSidedProp<T extends string>(
  prop: T,
  side: DevtoolsPosition,
) {
  return `${prop}${
    side.charAt(0).toUpperCase() + side.slice(1)
  }` as `${T}${Capitalize<DevtoolsPosition>}`
}

/**
 * Returns the color of a query's status: blue while fetching, gray without observers, purple while
 * paused, yellow when stale, otherwise green.
 * @param params - The query's `queryState`, `observerCount`, and `isStale`.
 * @returns The color name.
 */
export function getQueryStatusColor({
  queryState,
  observerCount,
  isStale,
}: {
  queryState: Query['state'] | undefined
  observerCount: number
  isStale: boolean
}) {
  return queryState?.fetchStatus === 'fetching'
    ? 'blue'
    : !observerCount
      ? 'gray'
      : queryState?.fetchStatus === 'paused'
        ? 'purple'
        : isStale
          ? 'yellow'
          : 'green'
}

/**
 * Returns the color of a mutation's status: purple while paused, red on error, yellow while pending,
 * green on success, otherwise gray.
 * @param params - The mutation's `status` and `isPaused`.
 * @returns The color name.
 */
export function getMutationStatusColor({
  status,
  isPaused,
}: {
  status: Mutation['state']['status']
  isPaused: boolean
}) {
  return isPaused
    ? 'purple'
    : status === 'error'
      ? 'red'
      : status === 'pending'
        ? 'yellow'
        : status === 'success'
          ? 'green'
          : 'gray'
}

/**
 * Returns the color of a query status label.
 * @param label - A label returned by {@link getQueryStatusLabel}.
 * @returns The color name.
 */
export function getQueryStatusColorByLabel(label: QueryStatusLabel) {
  return label === 'fresh'
    ? 'green'
    : label === 'stale'
      ? 'yellow'
      : label === 'paused'
        ? 'purple'
        : label === 'inactive'
          ? 'gray'
          : 'blue'
}

/**
 * Displays a string regardless of the type of the data.
 * @param value - Value to be stringified
 * @param beautify - Formats json to multiline
 * @returns The value serialized with `superjson`, as a JSON string.
 */
export const displayValue = (value: unknown, beautify: boolean = false) => {
  const { json } = serialize(value)

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

const dateSort: SortFn = (a, b) => {
  const diff = b.state.dataUpdatedAt - a.state.dataUpdatedAt
  return diff < 0 ? -1 : diff > 0 ? 1 : 0
}

const statusAndDateSort: SortFn = (a, b) => {
  if (getStatusRank(a) === getStatusRank(b)) {
    return dateSort(a, b)
  }

  return getStatusRank(a) > getStatusRank(b) ? 1 : -1
}

export const sortFns: Record<string, SortFn> = {
  status: statusAndDateSort,
  'query hash': queryHashSort,
  'last updated': dateSort,
}

type MutationSortFn = (a: Mutation, b: Mutation) => number

const getMutationStatusRank = (m: Mutation) =>
  m.state.isPaused
    ? 0
    : m.state.status === 'error'
      ? 2
      : m.state.status === 'pending'
        ? 1
        : 3

const mutationDateSort: MutationSortFn = (a, b) =>
  a.state.submittedAt < b.state.submittedAt ? 1 : -1

const mutationStatusSort: MutationSortFn = (a, b) => {
  if (getMutationStatusRank(a) === getMutationStatusRank(b)) {
    return mutationDateSort(a, b)
  }

  return getMutationStatusRank(a) > getMutationStatusRank(b) ? 1 : -1
}

export const mutationSortFns: Record<string, MutationSortFn> = {
  status: mutationStatusSort,
  'last updated': mutationDateSort,
}

/**
 * Converts a length in `rem` to pixels, using the root element's font size.
 * @param rem - The length in `rem`.
 * @returns The length in pixels.
 */
export const convertRemToPixels = (rem: number) => {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

/**
 * Tracks the user's `prefers-color-scheme` setting.
 * @returns An accessor of `'light'` or `'dark'`, updated when the setting
 * changes.
 */
export const getPreferredColorScheme = () => {
  const [colorScheme, setColorScheme] = createSignal<'light' | 'dark'>('dark')

  onMount(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setColorScheme(query.matches ? 'dark' : 'light')
    const listener = (e: MediaQueryListEvent) => {
      setColorScheme(e.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', listener)
    onCleanup(() => query.removeEventListener('change', listener))
  })

  return colorScheme
}

/**
 * Updates nested data by path.
 * @param oldData - Data to be updated
 * @param updatePath - Path to the data to be updated
 * @param value - New value
 * @returns A copy of `oldData` with the value at `updatePath` replaced.
 */
export const updateNestedDataByPath = (
  oldData: unknown,
  updatePath: Array<string>,
  value: unknown,
): any => {
  if (updatePath.length === 0) {
    return value
  }

  if (oldData instanceof Map) {
    const newData = new Map(oldData)

    if (updatePath.length === 1) {
      newData.set(updatePath[0], value)
      return newData
    }

    const [head, ...tail] = updatePath
    newData.set(head, updateNestedDataByPath(newData.get(head), tail, value))
    return newData
  }

  if (oldData instanceof Set) {
    const setAsArray = updateNestedDataByPath(
      Array.from(oldData),
      updatePath,
      value,
    )

    return new Set(setAsArray)
  }

  if (Array.isArray(oldData)) {
    const newData = [...oldData]

    if (updatePath.length === 1) {
      // @ts-expect-error
      newData[updatePath[0]] = value
      return newData
    }

    const [head, ...tail] = updatePath
    // @ts-expect-error
    newData[head] = updateNestedDataByPath(newData[head], tail, value)

    return newData
  }

  if (oldData instanceof Object) {
    const newData = { ...oldData }

    if (updatePath.length === 1) {
      // @ts-expect-error
      newData[updatePath[0]] = value
      return newData
    }

    const [head, ...tail] = updatePath
    // @ts-expect-error
    newData[head] = updateNestedDataByPath(newData[head], tail, value)

    return newData
  }

  return oldData
}

/**
 * Deletes nested data by path.
 * @param oldData - Data to be updated
 * @param deletePath - Path to the data to be deleted
 * @returns newData without the deleted items by path
 */
export const deleteNestedDataByPath = (
  oldData: unknown,
  deletePath: Array<string>,
): any => {
  if (oldData instanceof Map) {
    const newData = new Map(oldData)

    if (deletePath.length === 1) {
      newData.delete(deletePath[0])
      return newData
    }

    const [head, ...tail] = deletePath
    newData.set(head, deleteNestedDataByPath(newData.get(head), tail))
    return newData
  }

  if (oldData instanceof Set) {
    const setAsArray = deleteNestedDataByPath(Array.from(oldData), deletePath)
    return new Set(setAsArray)
  }

  if (Array.isArray(oldData)) {
    const newData = [...oldData]

    if (deletePath.length === 1) {
      return newData.filter((_, idx) => idx.toString() !== deletePath[0])
    }

    const [head, ...tail] = deletePath

    // @ts-expect-error
    newData[head] = deleteNestedDataByPath(newData[head], tail)

    return newData
  }

  if (oldData instanceof Object) {
    const newData = { ...oldData }

    if (deletePath.length === 1) {
      // @ts-expect-error
      delete newData[deletePath[0]]
      return newData
    }

    const [head, ...tail] = deletePath
    // @ts-expect-error
    newData[head] = deleteNestedDataByPath(newData[head], tail)

    return newData
  }

  return oldData
}

/**
 * Sets up the goober stylesheet with a `nonce`, for pages with a Content Security Policy. Without a
 * `nonce`, it does nothing and goober creates the stylesheet itself.
 * @param nonce - The nonce to set on the style tag.
 * @param target - The shadow root to add the style tag to, instead of `document.head`.
 */
export const setupStyleSheet = (nonce?: string, target?: ShadowRoot) => {
  if (!nonce) return // Goober reads window.__nonce__ every time it creates or accesses its style
  // element (el.nonce = window.__nonce__). Without this, goober overwrites the
  // nonce we set on the pre-created element with undefined, clearing it.
  ;(window as any).__nonce__ = nonce

  const root = target ?? document.head
  if (root.querySelector('#_goober')) return
  const styleTag = document.createElement('style')
  const textNode = document.createTextNode('')
  styleTag.appendChild(textNode)
  styleTag.id = '_goober'
  styleTag.setAttribute('nonce', nonce)
  root.appendChild(styleTag)
}
