import type { Query } from '@tanstack/query-core'

type SortFn = (a: Query, b: Query) => number

// eslint-disable-next-line no-shadow
enum QueryState {
  Fetching = 0,
  Fresh,
  Stale,
  Inactive,
  Paused,
}

export function getQueryState(query: Query): QueryState {
  if (query.state.fetchStatus === 'fetching') {
    return QueryState.Fetching
  }
  if (query.state.fetchStatus === 'paused') {
    return QueryState.Paused
  }
  if (!query.getObserversCount()) {
    return QueryState.Inactive
  }
  if (query.isStale()) {
    return QueryState.Stale
  }

  return QueryState.Fresh
}

export function getQueryStateLabel(query: Query): string {
  const queryState = getQueryState(query)

  if (queryState === QueryState.Fetching) {
    return 'fetching'
  }
  if (queryState === QueryState.Paused) {
    return 'paused'
  }
  if (queryState === QueryState.Stale) {
    return 'stale'
  }
  if (queryState === QueryState.Inactive) {
    return 'inactive'
  }

  return 'fresh'
}

export function getQueryStatusFg(query: Query): number {
  const queryState = getQueryState(query)

  if (queryState === QueryState.Stale) {
    return 0x000000
  }

  return 0xffffff
}

export function getQueryStatusBg(query: Query): number {
  const queryState = getQueryState(query)

  if (queryState === QueryState.Fetching) {
    return 0x006bff
  }
  if (queryState === QueryState.Paused) {
    return 0x8c49eb
  }
  if (queryState === QueryState.Stale) {
    return 0xffb200
  }
  if (queryState === QueryState.Inactive) {
    return 0x3f4e60
  }

  return 0x008327
}

const queryHashSort: SortFn = (a, b) => a.queryHash.localeCompare(b.queryHash)

const dateSort: SortFn = (a, b) =>
  a.state.dataUpdatedAt < b.state.dataUpdatedAt ? 1 : -1

const statusAndDateSort: SortFn = (a, b) => {
  if (getQueryState(a) === getQueryState(b)) {
    return dateSort(a, b)
  }

  return getQueryState(a) > getQueryState(b) ? 1 : -1
}

export const sortFns: Record<string, SortFn> = {
  'Status > Last Updated': statusAndDateSort,
  'Query Hash': queryHashSort,
  'Last Updated': dateSort,
}
