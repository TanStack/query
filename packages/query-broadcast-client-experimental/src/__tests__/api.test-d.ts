import { QueryClient } from '@tanstack/query-core'
import { broadcastQueryClient, broadcastQueryClientRestore } from '..'
import type {
  BroadcastErrorEvent,
  BroadcastQueryClientOptions,
  BroadcastQueryClientRestoreOptions,
  BroadcastRestoreErrorEvent,
} from '..'
import type { QueryKey } from '@tanstack/query-core'

const queryClient = new QueryClient()

broadcastQueryClient({ queryClient })
broadcastQueryClient({
  queryClient,
  broadcastChannel: 'test-channel',
  respondToCacheRequests: true,
})
broadcastQueryClient({
  queryClient,
  respondToCacheRequests: false,
})

const shouldDehydrateQuery: NonNullable<
  BroadcastQueryClientOptions['dehydrateOptions']
>['shouldDehydrateQuery'] = (query) => {
  const queryHash: string = query.queryHash
  const queryKey: QueryKey = query.queryKey
  return queryHash.length > 0 && queryKey.length > 0
}

const onBroadcastError: NonNullable<
  BroadcastQueryClientOptions['onBroadcastError']
> = (error, event) => {
  const eventType: BroadcastErrorEvent['type'] = event.type
  const queryHash: string = event.queryHash
  const queryKey: QueryKey = event.queryKey

  void error
  void eventType
  void queryHash
  void queryKey

  return Promise.resolve()
}

const onBroadcastRestoreError: NonNullable<
  BroadcastQueryClientRestoreOptions['onBroadcastRestoreError']
> = (error, event) => {
  const eventType: BroadcastRestoreErrorEvent['type'] = event.type
  const requestId: string = event.requestId
  const responderId: string | undefined = event.responderId
  const responseId: string | undefined = event.responseId
  const queryHash: string | undefined = event.queryHash
  const queryKey: QueryKey | undefined = event.queryKey

  void error
  void eventType
  void requestId
  void responderId
  void responseId
  void queryHash
  void queryKey

  return Promise.resolve()
}

broadcastQueryClient({
  queryClient,
  respondToCacheRequests: true,
  dehydrateOptions: { shouldDehydrateQuery },
  onBroadcastError,
  onBroadcastRestoreError,
})

broadcastQueryClientRestore({
  queryClient,
  timeout: 250,
  dehydrateOptions: { shouldDehydrateQuery },
  hydrateOptions: {
    defaultOptions: {
      deserializeData: (data) => data,
    },
  },
  onBroadcastError,
  onBroadcastRestoreError,
})

broadcastQueryClientRestore({ queryClient })

broadcastQueryClientRestore({
  queryClient,
  // @ts-expect-error Restore sessions respond to cache requests automatically.
  respondToCacheRequests: false,
})

// @ts-expect-error queryClient is required by the public API.
broadcastQueryClient({})

// @ts-expect-error queryClient is required by the public API.
broadcastQueryClientRestore({})

broadcastQueryClient({
  queryClient,
  // @ts-expect-error hydrateOptions only applies while restoring a cache.
  hydrateOptions: {},
})

broadcastQueryClientRestore({
  queryClient,
  // @ts-expect-error Restore sessions do not accept the live responder flag.
  respondToCacheRequests: true,
})

broadcastQueryClientRestore({
  queryClient,
  dehydrateOptions: {
    // @ts-expect-error Mutations are intentionally excluded from bootstrap snapshots.
    shouldDehydrateMutation: () => true,
  },
})
