import { BroadcastChannel } from 'broadcast-channel'
import type { BroadcastChannelOptions } from 'broadcast-channel'
import type { QueryClient, QueryKey } from '@tanstack/query-core'

/**
 * Metadata describing a broadcast message that could not be delivered to
 * other tabs. Passed to {@link BroadcastQueryClientOptions.onBroadcastError}
 * so callers can correlate failures with the originating query.
 */
export interface BroadcastErrorEvent {
  type: 'added' | 'removed' | 'updated'
  queryHash: string
  queryKey: QueryKey
}

interface BroadcastQueryClientOptions {
  /** The QueryClient to sync. */
  queryClient: QueryClient
  /**
   * Unique channel name used to communicate between tabs and windows.
   * @default 'tanstack-query'
   */
  broadcastChannel?: string
  /** Options forwarded to the underlying `BroadcastChannel`. */
  options?: BroadcastChannelOptions
  /**
   * Called when a query event fails to broadcast to other tabs - most
   * commonly when the query's `state.data`, `state.error`, or `queryKey`
   * contains a value the structured-clone algorithm cannot serialize
   * (e.g. `ReadableStream`, `File`, functions, Vue `reactive` proxies).
   *
   * Provide this hook to route failures to an error tracker without
   * producing unhandled promise rejections. If omitted, a `console.warn`
   * is emitted in development so cross-tab sync failures are never
   * entirely silent.
   */
  onBroadcastError?: (error: unknown, event: BroadcastErrorEvent) => void
}

type BroadcastMessage =
  | { type: 'added'; queryHash: string; queryKey: QueryKey }
  | { type: 'removed'; queryHash: string; queryKey: QueryKey }
  | { type: 'updated'; queryHash: string; queryKey: QueryKey; state: unknown }

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

  // `broadcast-channel`'s `postMessage` returns a `Promise<void>` that rejects
  // when the payload cannot be structured-cloned. Attach a catch handler so
  // the rejection never escapes as an `unhandledrejection`, and surface the
  // offending query through the user's hook or a development-only warning.
  const safePost = (message: BroadcastMessage): void => {
    channel.postMessage(message).catch((error: unknown) => {
      const event: BroadcastErrorEvent = {
        type: message.type,
        queryHash: message.queryHash,
        queryKey: message.queryKey,
      }

      if (onBroadcastError) {
        // A throwing user handler would turn this `.catch` into a fresh
        // rejected promise and re-introduce the exact `unhandledrejection`
        // this helper exists to prevent. Guard the user-land call so the
        // guarantee holds even when the hook misbehaves.
        try {
          onBroadcastError(error, event)
        } catch (hookError) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[broadcastQueryClient] onBroadcastError threw while handling "${event.type}" for query ${event.queryHash}.`,
              hookError,
            )
          }
        }
        return
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[broadcastQueryClient] Failed to broadcast "${event.type}" event for query ${event.queryHash}. ` +
            'The query value could not be structured-cloned; cross-tab sync for this query was skipped.',
          error,
        )
      }
    })
  }

  const unsubscribe = queryCache.subscribe((queryEvent) => {
    if (transaction) {
      return
    }

    const {
      query: { queryHash, queryKey, state, observers },
    } = queryEvent

    if (queryEvent.type === 'updated' && queryEvent.action.type === 'success') {
      safePost({ type: 'updated', queryHash, queryKey, state })
    }

    if (queryEvent.type === 'removed' && observers.length > 0) {
      safePost({ type: 'removed', queryHash, queryKey })
    }

    if (queryEvent.type === 'added') {
      safePost({ type: 'added', queryHash, queryKey })
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
