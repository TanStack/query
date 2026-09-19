import { dehydrate, hydrate } from '@tanstack/query-core'
import { BroadcastChannel } from 'broadcast-channel'
import type {
  DehydrateOptions,
  DehydratedState,
  HydrateOptions,
  QueryClient,
  QueryKey,
  QueryState,
} from '@tanstack/query-core'
import type { BroadcastChannelOptions } from 'broadcast-channel'

/**
 * Metadata describing a broadcast that failed to be delivered to other tabs.
 * Passed to BroadcastQueryClientOptions.onBroadcastError so callers can
 * correlate failures with the originating query.
 */
export interface BroadcastErrorEvent {
  type: 'updated' | 'removed' | 'added'
  queryHash: string
  queryKey: QueryKey
}

/**
 * Metadata describing a bootstrap request, response, or hydration failure.
 */
export interface BroadcastRestoreErrorEvent {
  type: 'request' | 'response' | 'hydrate'
  requestId: string
  responderId?: string
  responseId?: string
  queryHash?: string
  queryKey?: QueryKey
}

type LiveBroadcastMessage =
  | {
      type: 'updated'
      queryHash: string
      queryKey: QueryKey
      state: QueryState
    }
  | { type: 'removed'; queryHash: string; queryKey: QueryKey }
  | { type: 'added'; queryHash: string; queryKey: QueryKey; state: QueryState }

type CacheRequest = {
  type: 'cache-request'
  requestId: string
}

type DehydratedQuery = DehydratedState['queries'][number]

type CacheResponse = {
  type: 'cache-response'
  requestId: string
  responderId: string
  responseId: string
  query: DehydratedQuery
}

type BroadcastMessage = LiveBroadcastMessage | CacheRequest | CacheResponse

export interface BroadcastQueryClientOptions {
  /** The QueryClient to sync. */
  queryClient: QueryClient
  /**
   * Unique channel name used to communicate between tabs and windows.
   * @default 'tanstack-query'
   */
  broadcastChannel?: string
  /** Options forwarded to the underlying BroadcastChannel. */
  options?: BroadcastChannelOptions
  /**
   * Called when a query event fails to broadcast to other tabs — most
   * commonly because the query's state.data, state.error, or queryKey
   * contains a value the structured-clone algorithm cannot serialize.
   *
   * Provide this to route failures to an error tracker. If omitted, a
   * console.warn is emitted in development so failures are never silent.
   *
   * May return a Promise; any rejection is caught internally so it cannot
   * cause a secondary unhandled rejection.
   */
  onBroadcastError?: (
    error: unknown,
    event: BroadcastErrorEvent,
  ) => void | Promise<void>
  /**
   * Allows this live-sync session to respond to bootstrap requests from
   * restore-enabled sessions. `broadcastQueryClientRestore` responds
   * automatically and does not expose this option.
   * @default false
   */
  respondToCacheRequests?: boolean
  /**
   * Query dehydration options used when this session responds to bootstrap
   * requests. They have no effect on a live-only session unless
   * `respondToCacheRequests` is enabled. Mutations are never included in
   * bootstrap snapshots.
   */
  dehydrateOptions?: Pick<DehydrateOptions, 'shouldDehydrateQuery'>
  /**
   * Called when a bootstrap request, response, or hydration operation fails.
   * Live synchronization failures continue to use `onBroadcastError`.
   */
  onBroadcastRestoreError?: (
    error: unknown,
    event: BroadcastRestoreErrorEvent,
  ) => void | Promise<void>
}

/**
 * Options for live synchronization with an initial cache bootstrap. The
 * restore session responds to cache requests automatically.
 */
export interface BroadcastQueryClientRestoreOptions extends Omit<
  BroadcastQueryClientOptions,
  'respondToCacheRequests'
> {
  /**
   * Maximum time to wait for responses from configured responder sessions.
   * @default 1000
   */
  timeout?: number
  /** Options used when applying each incoming query snapshot. */
  hydrateOptions?: HydrateOptions
}

type InternalOptions = BroadcastQueryClientOptions & {
  restoreOptions?: BroadcastQueryClientRestoreOptions
}

type Session = {
  cleanup: () => void
  restorePromise?: Promise<void>
}

const DEFAULT_RESTORE_TIMEOUT = 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCacheRequest(value: unknown): value is CacheRequest {
  return (
    isRecord(value) &&
    value.type === 'cache-request' &&
    typeof value.requestId === 'string'
  )
}

function isCacheResponse(value: unknown): value is CacheResponse {
  if (
    !isRecord(value) ||
    value.type !== 'cache-response' ||
    typeof value.requestId !== 'string' ||
    typeof value.responderId !== 'string' ||
    typeof value.responseId !== 'string' ||
    !isRecord(value.query)
  ) {
    return false
  }

  return (
    typeof value.query.queryHash === 'string' &&
    Array.isArray(value.query.queryKey) &&
    isRecord(value.query.state)
  )
}

function isLiveBroadcastMessage(value: unknown): value is LiveBroadcastMessage {
  if (
    !isRecord(value) ||
    (value.type !== 'updated' &&
      value.type !== 'removed' &&
      value.type !== 'added') ||
    typeof value.queryHash !== 'string' ||
    !Array.isArray(value.queryKey)
  ) {
    return false
  }

  return value.type === 'removed' || isRecord(value.state)
}

function createId(prefix: string): string {
  return (
    prefix +
    '-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2)
  )
}

function createBroadcastSession({
  queryClient,
  broadcastChannel = 'tanstack-query',
  options,
  onBroadcastError,
  respondToCacheRequests,
  dehydrateOptions,
  onBroadcastRestoreError,
  restoreOptions,
}: InternalOptions): Session {
  const timeout = restoreOptions?.timeout ?? DEFAULT_RESTORE_TIMEOUT

  if (!Number.isFinite(timeout) || timeout < 0) {
    throw new Error('broadcastQueryClientRestore timeout must be non-negative')
  }

  let transaction = false
  let cleaned = false
  const tx = (cb: () => void) => {
    transaction = true
    try {
      cb()
    } finally {
      // Guard against cb throwing while applying an incoming message.
      transaction = false
    }
  }

  const channel = new BroadcastChannel<BroadcastMessage>(broadcastChannel, {
    webWorkerSupport: false,
    ...options,
  })

  const queryCache = queryClient.getQueryCache()

  const safePost = (message: LiveBroadcastMessage): void => {
    const handleError = (error: unknown) => {
      const event: BroadcastErrorEvent = {
        type: message.type,
        queryHash: message.queryHash,
        queryKey: message.queryKey,
      }

      if (onBroadcastError) {
        const warnCallbackError = (callbackError: unknown) => {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              '[broadcastQueryClient] onBroadcastError threw while handling "' +
                event.type +
                '" for query ' +
                event.queryHash +
                '.',
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
          '[broadcastQueryClient] Failed to broadcast "' +
            event.type +
            '" event for query ' +
            event.queryHash +
            '. ' +
            'The query value could not be structured-cloned; cross-tab sync for this query was skipped.',
          error,
        )
      }
    }

    try {
      Promise.resolve(channel.postMessage(message)).catch(handleError)
    } catch (error) {
      handleError(error)
    }
  }

  let resolveRestore = () => {}
  let restoreActive = !!restoreOptions
  let restoreTimer: ReturnType<typeof setTimeout> | undefined
  const handledResponseIds = new Set<string>()
  const requestId = restoreOptions ? createId('request') : undefined
  const responderId = createId('responder')
  let responseNumber = 0

  const restorePromise = restoreOptions
    ? new Promise<void>((resolve) => {
        resolveRestore = resolve
      })
    : undefined

  const warnRestoreError = (
    error: unknown,
    event: BroadcastRestoreErrorEvent,
  ) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[broadcastQueryClient] Bootstrap ' +
          event.type +
          ' failed for request ' +
          event.requestId +
          '.',
        error,
      )
    }
  }

  const reportRestoreError = (
    error: unknown,
    event: BroadcastRestoreErrorEvent,
  ) => {
    if (!onBroadcastRestoreError) {
      warnRestoreError(error, event)
      return
    }

    let result: void | Promise<void>
    try {
      result = onBroadcastRestoreError(error, event)
    } catch (callbackError) {
      warnRestoreError(callbackError, event)
      return
    }

    result?.catch((callbackError) => {
      warnRestoreError(callbackError, event)
    })
  }

  const completeRestore = () => {
    if (!restoreActive) {
      return
    }
    restoreActive = false
    if (restoreTimer !== undefined) {
      clearTimeout(restoreTimer)
      restoreTimer = undefined
    }
    resolveRestore()
  }

  const safePostRestore = (
    message: CacheResponse | CacheRequest,
    event: BroadcastRestoreErrorEvent,
  ) => {
    try {
      Promise.resolve(channel.postMessage(message)).catch((error: unknown) => {
        reportRestoreError(error, event)
      })
    } catch (error) {
      reportRestoreError(error, event)
    }
  }

  /**
   * Answers bootstrap requests only for restore sessions or explicitly opted-in
   * live-sync sessions, preserving the legacy API's live-only behavior.
   */
  const respondToCacheRequest = (request: CacheRequest) => {
    if (!restoreOptions && !respondToCacheRequests) {
      return
    }

    let snapshot: DehydratedState
    try {
      snapshot = dehydrate(queryClient, {
        ...dehydrateOptions,
        ...restoreOptions?.dehydrateOptions,
        shouldDehydrateMutation: () => false,
      })
    } catch (error) {
      reportRestoreError(error, {
        type: 'request',
        requestId: request.requestId,
        responderId,
      })
      return
    }

    for (const query of snapshot.queries) {
      responseNumber += 1
      const responseId = responderId + '-' + responseNumber
      safePostRestore(
        {
          type: 'cache-response',
          requestId: request.requestId,
          responderId,
          responseId,
          query,
        },
        {
          type: 'response',
          requestId: request.requestId,
          responderId,
          responseId,
          queryHash: query.queryHash,
          queryKey: query.queryKey,
        },
      )
    }
  }

  const applyCacheResponse = (message: CacheResponse) => {
    if (!restoreOptions || !restoreActive || message.requestId !== requestId) {
      return
    }

    if (handledResponseIds.has(message.responseId)) {
      return
    }
    handledResponseIds.add(message.responseId)

    try {
      tx(() => {
        hydrate(
          queryClient,
          {
            mutations: [],
            queries: [message.query],
          },
          restoreOptions.hydrateOptions,
        )
      })
    } catch (error) {
      reportRestoreError(error, {
        type: 'hydrate',
        requestId: message.requestId,
        responderId: message.responderId,
        responseId: message.responseId,
        queryHash: message.query.queryHash,
        queryKey: message.query.queryKey,
      })
    }
  }

  const unsubscribe = queryCache.subscribe((queryEvent) => {
    if (transaction || cleaned) {
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
        state,
      })
    }
  })

  channel.onmessage = (action) => {
    if (cleaned) {
      return
    }

    if (isCacheRequest(action)) {
      respondToCacheRequest(action)
      return
    }

    if (isCacheResponse(action)) {
      applyCacheResponse(action)
      return
    }

    if (!isLiveBroadcastMessage(action)) {
      return
    }

    tx(() => {
      const { type, queryHash, queryKey } = action
      const query = queryCache.get(queryHash)

      if (type === 'updated') {
        if (query) {
          if (action.state.dataUpdatedAt < query.state.dataUpdatedAt) {
            return
          }
          query.setState(action.state)
          return
        }

        queryCache.build(
          queryClient,
          {
            queryKey,
            queryHash,
          },
          action.state,
        )
      } else if (type === 'removed') {
        if (query) {
          queryCache.remove(query)
        }
      } else {
        if (query) {
          if (action.state.dataUpdatedAt < query.state.dataUpdatedAt) {
            return
          }
          query.setState(action.state)
          return
        }
        queryCache.build(
          queryClient,
          {
            queryKey,
            queryHash,
          },
          action.state,
        )
      }
    })
  }

  if (restoreOptions && requestId) {
    restoreTimer = setTimeout(completeRestore, timeout)
    safePostRestore(
      {
        type: 'cache-request',
        requestId,
      },
      {
        type: 'request',
        requestId,
      },
    )
  }

  const cleanup = () => {
    if (cleaned) {
      return
    }
    cleaned = true
    completeRestore()
    unsubscribe()
    channel.onmessage = null
    const reportCloseError = (error: unknown) => {
      if (restoreOptions && requestId) {
        reportRestoreError(error, {
          type: 'request',
          requestId,
        })
      }
    }
    try {
      void Promise.resolve(channel.close()).catch(reportCloseError)
    } catch (error) {
      reportCloseError(error)
    }
  }

  return { cleanup, restorePromise }
}

/**
 * Starts live synchronization for a QueryClient without requesting an initial
 * cache snapshot. Set `respondToCacheRequests` to opt into answering restore
 * requests from other sessions.
 * @returns A function that stops synchronization and closes the channel.
 */
export function broadcastQueryClient(
  options: BroadcastQueryClientOptions,
): () => void {
  return createBroadcastSession(options).cleanup
}

/**
 * Starts live synchronization, automatically answers restore requests, and
 * requests an initial cache snapshot before resolving the restore promise.
 * @returns Cleanup and a promise that settles when restore or cleanup completes.
 */
export function broadcastQueryClientRestore(
  options: BroadcastQueryClientRestoreOptions,
): [cleanup: () => void, restorePromise: Promise<void>] {
  const session = createBroadcastSession({
    ...options,
    restoreOptions: options,
  })

  return [session.cleanup, session.restorePromise!]
}
