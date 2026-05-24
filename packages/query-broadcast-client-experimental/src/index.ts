import { BroadcastChannel } from 'broadcast-channel'
import type { BroadcastChannelOptions } from 'broadcast-channel'
import type { QueryClient } from '@tanstack/query-core'

interface BroadcastMessage {
  type: 'updated' | 'removed' | 'added'
  queryHash: string
  queryKey?: unknown
  state?: unknown
}

interface BroadcastQueryClientOptions {
  queryClient: QueryClient
  broadcastChannel?: string
  options?: BroadcastChannelOptions
  onBroadcastError?: (error: unknown, message: BroadcastMessage) => void
}

export function broadcastQueryClient({
  queryClient,
  broadcastChannel = 'tanstack-query',
  options,
  onBroadcastError,
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

  const safePost = (message: BroadcastMessage) => {
    channel.postMessage(message).catch((error: unknown) => {
      if (onBroadcastError) {
        try {
          onBroadcastError(error, message)
        } catch {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[broadcastQueryClient] failed to broadcast "${message.type}" for queryHash "${message.queryHash}":`,
              error,
            )
          }
        }
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[broadcastQueryClient] failed to broadcast "${message.type}" for queryHash "${message.queryHash}":`,
          error,
        )
      }
    })
  }

  const unsubscribe = queryClient.getQueryCache().subscribe((queryEvent) => {
    if (transaction) {
      return
    }

    const {
      query: { queryHash, queryKey, state, observers },
    } = queryEvent

    if (queryEvent.type === 'updated' && queryEvent.action.type === 'success') {
      safePost({
        type: 'updated',
        queryHash,
        queryKey,
        state,
      })
    }

    if (queryEvent.type === 'removed' && observers.length > 0) {
      safePost({
        type: 'removed',
        queryHash,
        queryKey,
      })
    }

    if (queryEvent.type === 'added') {
      safePost({
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
