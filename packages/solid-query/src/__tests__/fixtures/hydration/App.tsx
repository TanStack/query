/**
 * Shared fixture app for the SSR → hydration tests.
 *
 * This module is compiled twice by the test harness (see
 * `src/__tests__/hydration.test.tsx`): once with the Solid SSR transform
 * (consumed by `entry-server.tsx`) and once with the hydratable DOM
 * transform (consumed by `entry-client.tsx`).
 */
import { Loading, Show } from 'solid-js'
import {
  QueryClientProvider,
  useIsFetching,
  useQuery,
} from '@tanstack/solid-query'
import type { QueryClient } from '@tanstack/solid-query'

const isServer = typeof window === 'undefined'

export interface FetchCounts {
  fresh: number
  stale: number
  placeholder: number
  prefetched: number
}

export interface AppProps {
  client: QueryClient
  /** Marker baked into the query data so tests can tell where it was fetched. */
  source: 'server' | 'client'
  counts: FetchCounts
  /** Toggled by tests after hydration to mount a subtree that was never
   * rendered on the server — its query must adopt the server's prefetched
   * payload from the registry instead of refetching. */
  lateMount?: () => boolean
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

/** Never rendered on the server — mounted by tests after hydration. Its
 * query was prefetched (and only prefetched) during SSR; the hash-keyed
 * registry entry must satisfy it with zero client fetches. */
function LateConsumer(props: AppProps) {
  const late = useQuery(() => ({
    queryKey: ['prefetched'],
    queryFn: async () => {
      props.counts.prefetched++
      await sleep(5)
      return `prefetched-${props.source}`
    },
    staleTime: 60_000,
  }))
  return <span id="late">{late.data}</span>
}

export function App(props: AppProps) {
  // Cache coverage beyond the rendered tree: prefetch a query no component
  // reads during this render. Fired synchronously during setup, so the
  // provider's serializer catches the fetch dispatch while the request's
  // serialization context is live.
  if (isServer) {
    void props.client.prefetchQuery({
      queryKey: ['prefetched'],
      queryFn: async () => {
        props.counts.prefetched++
        await sleep(5)
        return `prefetched-${props.source}`
      },
    })
  }
  return (
    <QueryClientProvider client={props.client}>
      <Loading fallback={<div>loading</div>}>
        <Queries {...props} />
        <Show when={props.lateMount?.()}>
          <LateConsumer {...props} />
        </Show>
      </Loading>
    </QueryClientProvider>
  )
}
