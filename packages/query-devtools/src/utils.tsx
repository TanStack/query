import { serialize } from 'superjson'
import type { Query } from '@tanstack/query-core'
import type { DevtoolsPosition } from './Context'

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

export const queryStatusLabels = [
  'fresh',
  'stale',
  'paused',
  'inactive',
  'fetching',
] as const
export type IQueryStatusLabel = (typeof queryStatusLabels)[number]

export function getSidedProp<T extends string>(
  prop: T,
  side: DevtoolsPosition,
) {
  return `${prop}${
    side.charAt(0).toUpperCase() + side.slice(1)
  }` as `${T}${Capitalize<DevtoolsPosition>}`
}

export function getQueryStatusColor({
  queryState,
  observerCount,
  isStale,
}: {
  queryState: Query['state']
  observerCount: number
  isStale: boolean
}) {
  return queryState.fetchStatus === 'fetching'
    ? 'blue'
    : !observerCount
    ? 'gray'
    : queryState.fetchStatus === 'paused'
    ? 'purple'
    : isStale
    ? 'yellow'
    : 'green'
}

export function getQueryStatusColorByLabel(label: IQueryStatusLabel) {
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
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 * @param {boolean} beautify Formats json to multiline
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

const dateSort: SortFn = (a, b) =>
  a.state.dataUpdatedAt < b.state.dataUpdatedAt ? 1 : -1

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

export const convertRemToPixels = (rem: number) => {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}

export const convertPixelsToRem = (px: number) => px / convertRemToPixels(1)

/**
 * updates nested data by path
 *
 * @param {unknown} oldData Data to be updated
 * @param {Array<string>} updatePath Path to the data to be updated
 * @param {unknown} value New value
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
 * Deletes nested data by path
 *
 * @param {unknown} oldData Data to be updated
 * @param {Array<string>} deletePath Path to the data to be deleted
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
