/**
 * Shared fixture app for the SSR → hydration tests.
 *
 * This module is compiled twice by the test harness (see
 * `src/__tests__/hydration.test.tsx`): once with the Solid SSR transform
 * (consumed by `entry-server.tsx`) and once with the hydratable DOM
 * transform (consumed by `entry-client.tsx`).
 */
import { Loading } from 'solid-js'
import {
  QueryClientProvider,
  useIsFetching,
  useQuery,
} from '@tanstack/solid-query'
import type { QueryClient } from '@tanstack/solid-query'

export interface FetchCounts {
  fresh: number
  stale: number
  placeholder: number
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

  // Cross-cache aggregate: must serialize the hydration-time truth (0 —
  // the hydrating client's fetches are held and primed entries are
  // settled) and stay latched there through the hydration window.
  const fetching = useIsFetching()

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

  // Placeholder short-circuit: the data compute serves the placeholder
  // before the fetch-pull branch, so this must NOT fetch during SSR — the
  // placeholder itself is the serialized output (no boundary hold, raw
  // meta stays 'pending' which is its settled SSR truth), and the client
  // fetches for real only after its hydration window closes.
  const placeholder = useQuery(() => ({
    queryKey: ['placeholder'],
    queryFn: async () => {
      props.counts.placeholder++
      await sleep(5)
      return `placeholder-resolved-${props.source}`
    },
    placeholderData: 'placeholder-value',
    staleTime: 60_000,
  }))

  return (
    <div>
      <span id="fresh">{fresh.data}</span>
      <span id="stale">{stale.data}</span>
      {/* Meta guards: boundaries serialize settled state only, so these
          must show settled values in the server HTML — a transient
          ('pending', fetching) here is a hydration mismatch in waiting. */}
      <span id="meta">
        {fresh.status}|{String(fresh.isFetching)}|{String(fresh.isSuccess)}|
        {String(fresh.isFetchedAfterMount)}
      </span>
      <span id="global">{fetching()}</span>
      <span id="ph">
        {placeholder.data}|{String(placeholder.isPlaceholderData)}|
        {placeholder.status}
      </span>
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
