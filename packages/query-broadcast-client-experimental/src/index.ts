import { BroadcastChannel } from 'broadcast-channel'
import type { BroadcastChannelOptions } from 'broadcast-channel'
import type { Query, QueryClient, QueryKey } from '@tanstack/query-core'

/**
 * Metadata describing a broadcast that failed to be delivered to other tabs.
 * Passed to {@link BroadcastQueryClientOptions.onBroadcastError} so callers
 * can correlate failures with the originating query.
 */
export interface BroadcastErrorEvent {
  /**
   * The kind of cache event that was being broadcast.
   */
  type: 'updated' | 'removed' | 'added'
  /**
   * The hash of the query the broadcast was about.
   */
  queryHash: string
  /**
   * The key of the query the broadcast was about.
   */
  queryKey: QueryKey
}

type BroadcastMessage =
  | { type: 'updated'; queryHash: string; queryKey: QueryKey; state: unknown }
  | { type: 'removed'; queryHash: string; queryKey: QueryKey }
  | { type: 'added'; queryHash: string; queryKey: QueryKey; state: unknown }

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
   * Called when a query event fails to broadcast to other tabs — most
   * commonly because the query's `state.data`, `state.error`, or `queryKey`
   * contains a value the structured-clone algorithm cannot serialize
   * (e.g. `ReadableStream`, `File`, functions, Vue `reactive` proxies).
   *
   * Provide this to route failures to an error tracker. If omitted, a
   * `console.warn` is emitted in development so failures are never silent.
   *
   * May return a `Promise`; any rejection is caught internally so it cannot
   * cause a secondary unhandled rejection.
   */
  onBroadcastError?: (
    error: unknown,
    event: BroadcastErrorEvent,
  ) => void | Promise<void>
}

/**
 * Syncs a client's query cache with the caches of other tabs and windows through a
 * `BroadcastChannel`: added queries, successful updates, and removals of queries that have
 * observers are broadcast, and those received from other tabs are applied.
 * @param options - The `queryClient` to sync, the `broadcastChannel` name, the channel `options`,
 * and the `onBroadcastError` callback.
 * @returns A function that stops syncing and closes the channel.
 */
export function broadcastQueryClient({
  queryClient,
  broadcastChannel = 'tanstack-query',
  options,
  onBroadcastError,
}: BroadcastQueryClientOptions): () => void {
  let transaction: true | Query | false = false
  const tx = (cb: () => void, removedQuery?: Query) => {
    const previous = transaction
    transaction = removedQuery ?? true
    try {
      cb()
    } finally {
      // Restore the prior suppression even when an incoming cache operation
      // triggers a listener that throws. Otherwise later local changes would
      // stop broadcasting.
      transaction = previous
    }
  }

  const channel = new BroadcastChannel(broadcastChannel, {
    webWorkerSupport: false,
    ...options,
  })

  const queryCache = queryClient.getQueryCache()

  const safePost = (message: BroadcastMessage): void => {
    channel.postMessage(message).catch((error: unknown) => {
      const event: BroadcastErrorEvent = {
        type: message.type,
        queryHash: message.queryHash,
        queryKey: message.queryKey,
      }

      if (onBroadcastError) {
        const warnCallbackError = (callbackError: unknown) => {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              `[broadcastQueryClient] onBroadcastError threw while handling "${event.type}" for query ${event.queryHash}.`,
              callbackError,
            )
          }
        }
        let result: void | Promise<void>
        try {
          result = onBroadcastError(error, event)
        } catch (callbackError) {
          warnCallbackError(callbackError)
          return
        }
        result?.catch(warnCallbackError)
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[broadcastQueryClient] Failed to broadcast "${event.type}" event for query ${event.queryHash}. ` +
            'The query value could not be structured-cloned; cross-tab sync for this query was skipped.',
          error,
        )
      }
    })
  }

  const unsubscribe = queryCache.subscribe((queryEvent) => {
    if (
      transaction === true ||
      (transaction &&
        queryEvent.type === 'removed' &&
        queryEvent.query === transaction)
    ) {
      return
    }

    const {
      query: { queryHash, queryKey, state },
    } = queryEvent

    if (queryEvent.type === 'updated' && queryEvent.action.type === 'success') {
      safePost({
        type: 'updated',
        queryHash,
        queryKey,
        state,
      })
    }

    const replacement =
      queryEvent.type === 'removed' ? queryCache.get(queryHash) : undefined
    if (
      queryEvent.type === 'removed' &&
      (queryEvent.observedAtRemoval || replacement)
    ) {
      safePost({
        type: 'removed',
        queryHash,
        queryKey,
      })
      // An earlier cache listener may have added a same-key replacement
      // before this removal reached us. Re-send its current state after the
      // removal so a peer does not discard the replacement it heard first.
      if (replacement && replacement !== queryEvent.query) {
        safePost({
          type: 'added',
          queryHash,
          queryKey: replacement.queryKey,
          state: replacement.state,
        })
      }
    }

    if (queryEvent.type === 'added') {
      safePost({
        type: 'added',
        queryHash,
        queryKey,
        state,
      })
    }
  })

  channel.onmessage = (action) => {
    if (!action?.type) {
      return
    }

    const { type, queryHash, queryKey, state } = action
    const query = queryCache.get(queryHash)
    tx(
      () => {
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
            if (query.state.data === undefined) {
              query.setState(state)
            }
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
      },
      type === 'removed' ? query : undefined,
    )
  }
  return () => {
    unsubscribe()
    channel.close()
  }
}
