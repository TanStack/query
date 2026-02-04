import { BroadcastChannel } from 'broadcast-channel'
import type { BroadcastChannelOptions } from 'broadcast-channel'
import type { QueryClient } from '@tanstack/query-core'

interface BroadcastQueryClientOptions {
  queryClient: QueryClient
  broadcastChannel?: string
  options?: BroadcastChannelOptions
}

export function broadcastQueryClient({
  queryClient,
  broadcastChannel = 'tanstack-query',
  options,
}: BroadcastQueryClientOptions): () => void {
  let transaction = false
  const tx = (cb: () => void) => {
    transaction = true
    cb()
    transaction = false
  }

  const channel = new BroadcastChannel(broadcastChannel, {
    webWorkerSupport: false,
    ...options,
  })

  const queryCache = queryClient.getQueryCache()

  const unsubscribe = queryClient.getQueryCache().subscribe((queryEvent) => {
    if (transaction) {
      return
    }

    const {
      query: { queryHash, queryKey, state, observers },
    } = queryEvent

    if (queryEvent.type === 'updated' && queryEvent.action.type === 'success') {
      channel.postMessage({
        type: 'updated',
        queryHash,
        queryKey,
        state,
      })
    }

    if (queryEvent.type === 'removed' && observers.size > 0) {
      channel.postMessage({
        type: 'removed',
        queryHash,
        queryKey,
      })
    }

    if (queryEvent.type === 'added') {
      channel.postMessage({
        type: 'added',
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
      const { type, queryHash, queryKey, state } = action

      const query = queryCache.get(queryHash)

      if (type === 'updated') {
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
      } else if (type === 'removed') {
        if (query) {
          queryCache.remove(query)
        }
      } else if (type === 'added') {
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
      }
    })
  }
  return () => {
    unsubscribe()
    channel.close()
  }
}
