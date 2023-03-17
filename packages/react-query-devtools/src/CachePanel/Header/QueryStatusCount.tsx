import React from 'react'
import type { QueryCache } from '@tanstack/react-query'

import { Code, QueryKey, QueryKeys } from '../../styledComponents'
import { getQueryStatusLabel } from '../../utils'
import useSubscribeToQueryCache from '../../useSubscribeToQueryCache'
import { defaultTheme as theme } from '../../theme'

export default function QueryStatusCount({
  queryCache,
}: {
  queryCache: QueryCache
}) {
  const hasFresh = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'fresh')
        .length,
  )
  const hasFetching = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'fetching')
        .length,
  )
  const hasPaused = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'paused')
        .length,
  )
  const hasStale = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'stale')
        .length,
  )
  const hasInactive = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'inactive')
        .length,
  )
  return (
    <QueryKeys>
      <QueryKey
        style={{
          background: theme.success,
          opacity: hasFresh ? 1 : 0.3,
        }}
      >
        fresh <Code>({hasFresh})</Code>
      </QueryKey>{' '}
      <QueryKey
        style={{
          background: theme.active,
          opacity: hasFetching ? 1 : 0.3,
        }}
      >
        fetching <Code>({hasFetching})</Code>
      </QueryKey>{' '}
      <QueryKey
        style={{
          background: theme.paused,
          opacity: hasPaused ? 1 : 0.3,
        }}
      >
        paused <Code>({hasPaused})</Code>
      </QueryKey>{' '}
      <QueryKey
        style={{
          background: theme.warning,
          color: 'black',
          textShadow: '0',
          opacity: hasStale ? 1 : 0.3,
        }}
      >
        stale <Code>({hasStale})</Code>
      </QueryKey>{' '}
      <QueryKey
        style={{
          background: theme.gray,
          opacity: hasInactive ? 1 : 0.3,
        }}
      >
        inactive <Code>({hasInactive})</Code>
      </QueryKey>
    </QueryKeys>
  )
}
