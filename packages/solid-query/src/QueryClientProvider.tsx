import {
  createContext,
  createRenderEffect,
  createSignal,
  onCleanup,
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
  // Server: the computation's value IS the channel's async iterable, so
  // Solid serializes it through its normal per-computation signal path:
  // the server runtime tees the iterator into the hydration serializer
  // (`ctx.serialize(id, tapped)` in solid-js' `processResult`) and
  // seroval streams each cumulative dehydrated-cache snapshot to the
  // client as a chunk riding the SSR stream, with the entry objects
  // inside deduplicated by reference against everything else in the
  // payload. Nothing reads the signal during SSR, so it never suspends
  // anything.
  //
  // Client, hydrating: Solid replays the serialized iterable through the
  // per-computation signal path (`hydrateSignalFromAsyncIterable`).
  // Yields that were still buffered when hydration began are conflated
  // to the LATEST yield (`normalizeIterator`) — lossless here because
  // every yield is a cumulative snapshot — and live yields after that
  // apply one at a time. Requires a solid-js build with the buffered
  // async-iterable replay conflation fix (> 2.0.0-beta.32): before it,
  // the replay dropped every buffered yield after the first, including
  // the terminal `done` snapshot. The render effect below hands each
  // signal value to the coordinator, which primes the QueryClient via
  // query-core hydrate() (newer-wins) and unblocks `useBaseQuery`
  // subscribers waiting on their query's entry.
  //
  // Client, fresh mount: the compute returns undefined and the effect
  // never fires.
  const [channelValue] = createSignal<DehydrationChannelYield | undefined>(
    () => (isServer ? createServerDehydrationChannel(props.client) : undefined),
  )
  const coordinator = isServer
    ? null
    : createHydrationCoordinator(() => props.client)
  createRenderEffect(
    () => (isServer ? undefined : channelValue()),
    (value) => {
      if (value && coordinator) {
        coordinator.applyYield(value)
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
