/**
 * Shared fixture app for the SSR → hydration tests.
 *
 * This module is compiled twice by the test harness (see
 * `src/__tests__/hydration.test.tsx`): once with the Solid SSR transform
 * (consumed by `entry-server.tsx`) and once with the hydratable DOM
 * transform (consumed by `entry-client.tsx`).
 */
import { Loading } from 'solid-js'
import { QueryClientProvider, useQuery } from '@tanstack/solid-query'
import type { QueryClient } from '@tanstack/solid-query'

export interface FetchCounts {
  fresh: number
  stale: number
}

export interface AppProps {
  client: QueryClient
  /** Marker baked into the query data so tests can tell where it was fetched. */
  source: 'server' | 'client'
  counts: FetchCounts
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function Queries(props: AppProps) {
  // Fresh for a minute: after hydration this must NOT refetch on mount.
  const fresh = useQuery(() => ({
    queryKey: ['fresh'],
    queryFn: async () => {
      props.counts.fresh++
      await sleep(5)
      return `fresh-${props.source}`
    },
    staleTime: 60_000,
  }))

  // Immediately stale: normal staleness rules mean this refetches on mount.
  const stale = useQuery(() => ({
    queryKey: ['stale'],
    queryFn: async () => {
      props.counts.stale++
      await sleep(5)
      return `stale-${props.source}`
    },
    staleTime: 0,
  }))

  return (
    <div>
      <span id="fresh">{fresh.data}</span>
      <span id="stale">{stale.data}</span>
    </div>
  )
}

export function App(props: AppProps) {
  return (
    <QueryClientProvider client={props.client}>
      <Loading fallback={<div>loading</div>}>
        <Queries {...props} />
      </Loading>
    </QueryClientProvider>
  )
}
