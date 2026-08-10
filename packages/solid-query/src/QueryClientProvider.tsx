import {
  createContext,
  createRenderEffect,
  createStore,
  onCleanup,
  snapshot,
  useContext,
} from 'solid-js'
import {
  HydrationCoordinatorContext,
  createHydrationCoordinator,
  createServerDehydrationChannel,
} from './hydrationChannel'
import type { DehydrationChannelYield } from './hydrationChannel'
import type { QueryClient } from './QueryClient'
import type { JSX } from '@solidjs/web'

const isServer = typeof window === 'undefined'

export const QueryClientContext = createContext<(() => QueryClient) | null>(
  null,
)

export const useQueryClient = (queryClient?: QueryClient) => {
  if (queryClient) {
    return queryClient
  }
  const client = useContext(QueryClientContext)

  if (!client) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one')
  }

  return client()
}

export type QueryClientProviderProps = {
  client: QueryClient
  children?: JSX.Element
}

export const QueryClientProvider = (
  props: QueryClientProviderProps,
): JSX.Element => {
  props.client.mount()
  onCleanup(() => props.client.unmount())

  // Library-owned serialization channel for SSR dehydration.
  //
  // Server: the store's initializer returns an async generator that
  // writes cumulative dehydrated-query snapshots into the draft as
  // queries settle during SSR. It is a plain async store computation, so
  // Solid serializes it through its normal per-computation path: each
  // yield's draft mutations ride the SSR stream as store patches (the
  // same flush as the content that awaited them), and the entry objects
  // inside them are deduplicated by reference (seroval) against
  // everything else in the payload.
  //
  // The channel is store-shaped rather than signal-shaped on purpose:
  // Solid's hydration replay applies *every* buffered yield of a store's
  // async iterable in order (`hydrateStoreFromAsyncIterable`), while a
  // signal's replay collapses buffered yields into the latest — and its
  // final done-result supersedes them — which would drop entries whenever
  // hydration begins after their chunks already arrived.
  //
  // Client, hydrating: the store replays from the serialized value; the
  // render effect below applies each state of the channel to the
  // QueryClient via query-core hydrate() (newer-wins) and unblocks
  // `useBaseQuery` subscribers waiting on their query's entry.
  //
  // Client, fresh mount: the initializer returns undefined and the store
  // keeps its (empty) initial value.
  const [channelState] = createStore<DehydrationChannelYield>(
    (draft) => {
      if (!isServer) return undefined
      const channel = createServerDehydrationChannel(props.client)
      return (async function* () {
        // Settle the store's serialized first snapshot as the empty
        // initial state, so every entry travels as a patch and keeps its
        // object identity for seroval's reference deduplication (the
        // first snapshot is JSON-cloned by the runtime, which would
        // break it).
        yield undefined
        for await (const value of channel) {
          draft.entries = value.entries
          draft.done = value.done
          yield undefined
        }
      })()
    },
    { entries: [], done: false },
  )
  const coordinator = isServer
    ? null
    : createHydrationCoordinator(() => props.client)
  createRenderEffect(
    () =>
      isServer
        ? undefined
        : { entries: channelState.entries, done: channelState.done },
    (value) => {
      if (value && coordinator && (value.entries.length > 0 || value.done)) {
        // Unwrap the store proxies so raw entry objects reach the cache.
        coordinator.applyYield(snapshot(value) as DehydrationChannelYield)
      }
    },
  )

  return (
    <QueryClientContext value={() => props.client}>
      <HydrationCoordinatorContext value={coordinator}>
        {props.children}
      </HydrationCoordinatorContext>
    </QueryClientContext>
  )
}
