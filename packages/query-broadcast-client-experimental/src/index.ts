import { BroadcastChannel } from 'broadcast-channel'
import type { QueryClient } from '@tanstack/query-core'
import { dehydrate, hydrate } from '@tanstack/query-core'

interface BroadcastQueryClientOptions {
  queryClient: QueryClient
  broadcastChannel?: string
}

const EventType = {
  updated: 'updated',
  removed: 'removed',
  cacheSnapshotRequested: 'cacheSnapshotRequested',
  cacheSnapshotCreated: 'cacheSnapshotCreated',
} as const

export function broadcastQueryClient({
  queryClient,
  broadcastChannel = 'tanstack-query',
}: BroadcastQueryClientOptions) {
  let transaction = false
  let hasBeenHydrated = false
  const tx = (cb: () => void) => {
    transaction = true
    cb()
    transaction = false
  }

  const channel = new BroadcastChannel(broadcastChannel, {
    webWorkerSupport: false,
  })

  const queryCache = queryClient.getQueryCache()

  channel.postMessage({
    type: EventType.cacheSnapshotRequested,
  })

  queryClient.getQueryCache().subscribe((queryEvent) => {
    if (transaction) {
      return
    }

    const {
      query: { queryHash, queryKey, state },
    } = queryEvent

    if (queryEvent.type === 'updated' && queryEvent.action.type === 'success') {
      channel.postMessage({
        type: EventType.updated,
        queryHash,
        queryKey,
        state,
      })
    }

    if (queryEvent.type === 'removed') {
      channel.postMessage({
        type: EventType.removed,
        queryHash,
        queryKey,
      })
    }
  })

  channel.onmessage = (action) => {
    if (!action?.type) {
      return
    }

    tx(() => {
      const { type, queryHash, queryKey, state, cacheSnapshot } = action
      const shouldHydrateCache =
        type === EventType.cacheSnapshotCreated &&
        !hasBeenHydrated &&
        cacheSnapshot

      if (type === EventType.updated) {
        const query = queryCache.get(queryHash)

        if (query) {
          query.setState(state)
          return
        }

        queryCache.build(
          queryClient,
          {
            queryKey,
            queryHash,
          },
          state,
        )
      } else if (type === EventType.removed) {
        const query = queryCache.get(queryHash)

        if (query) {
          queryCache.remove(query)
        }
      } else if (type === EventType.cacheSnapshotRequested) {
        channel.postMessage({
          type: EventType.cacheSnapshotCreated,
          cacheSnapshot: dehydrate(queryClient),
        })
      } else if (shouldHydrateCache) {
        hydrate(queryClient, cacheSnapshot)
        hasBeenHydrated = true
      }
    })
  }
}
