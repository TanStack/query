import { BroadcastChannel } from 'broadcast-channel'
import type { BroadcastChannelOptions } from 'broadcast-channel'
import type { QueryClient, QueryKey, QueryState } from '@tanstack/query-core'

interface BroadcastQueryClientOptions {
  queryClient: QueryClient
  broadcastChannel?: string
  options?: BroadcastChannelOptions
}

type BroadcastMessage =
  | { type: 'added' | 'removed'; queryHash: string; queryKey: QueryKey }
  | {
      type: 'updated'
      queryHash: string
      queryKey: QueryKey
      state: QueryState
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

  // `postMessage` structurally clones its payload and rejects with a
  // `DataCloneError` when the query holds non-serializable data (e.g. a
  // `ReadableStream`, `File`, or a framework proxy). Swallow the rejection so
  // it does not surface as an unhandled promise rejection, and log a helpful
  // warning in development instead of an opaque `node_modules` stack trace.
  const postMessage = (message: BroadcastMessage) => {
    channel.postMessage(message).catch((error: unknown) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[broadcastQueryClient] Failed to broadcast query "${message.queryHash}". Its state is likely not serializable.`,
          error,
        )
      }
    })
  }

  const queryCache = queryClient.getQueryCache()

  const unsubscribe = queryClient.getQueryCache().subscribe((queryEvent) => {
    if (transaction) {
      return
    }

    const {
      query: { queryHash, queryKey, state, observers },
    } = queryEvent

    if (queryEvent.type === 'updated' && queryEvent.action.type === 'success') {
      postMessage({
        type: 'updated',
        queryHash,
        queryKey,
        state,
      })
    }

    if (queryEvent.type === 'removed' && observers.length > 0) {
      postMessage({
        type: 'removed',
        queryHash,
        queryKey,
      })
    }

    if (queryEvent.type === 'added') {
      postMessage({
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
