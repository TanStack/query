---
id: broadcastQueryClient
title: broadcastQueryClient (Experimental)
---

> VERY IMPORTANT: This utility is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

`broadcastQueryClient` is a utility for broadcasting and syncing the state of your queryClient between browser tabs/windows with the same origin.

## Installation

This utility comes as a separate package and is available under the `'@tanstack/query-broadcast-client-experimental'` import.

## Usage

Import the `broadcastQueryClient` function, and pass it your `QueryClient` instance, and optionally, set a `broadcastChannel`.

```tsx
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'

const queryClient = new QueryClient()

broadcastQueryClient({
  queryClient,
  broadcastChannel: 'my-app',
})
```

## API

### broadcastQueryClientRestore

Use the additive restore API when a new tab must bootstrap its cache before
queries are allowed to fetch:

```tsx
import { broadcastQueryClientRestore } from '@tanstack/query-broadcast-client-experimental'

const [cleanup, restored] = broadcastQueryClientRestore({
  queryClient,
  broadcastChannel: 'my-app',
  timeout: 1000,
})

await restored
renderApplication()

// Later, when this QueryClient or broadcast session is disposed or replaced:
cleanup()
```

Keep `cleanup` for the lifetime of the QueryClient. Do not call it immediately
after `restored`, because the restore session also owns live synchronization.
Call it when the QueryClient or session is disposed or replaced so the previous
channel and query-cache listeners do not remain active.

The restore API starts normal live synchronization on the same channel before
requesting snapshots, and automatically responds to restore requests. Do not
call both APIs for the same QueryClient and channel; the restore API already
owns the live session.

The response window accepts snapshots from configured responder sessions. Query
state is merged with dataUpdatedAt, so the newest state for each query wins.
Bootstrap includes successful queries by default and excludes mutations. Each
query is sent independently so a structured-clone failure does not discard all
valid queries.

Framework applications should use the existing restore-aware integration:

```tsx
import { BroadcastQueryClientProvider } from '@tanstack/react-query-persist-client'
;<BroadcastQueryClientProvider
  client={queryClient}
  broadcastOptions={{ broadcastChannel: 'my-app', timeout: 1000 }}
>
  <App />
</BroadcastQueryClientProvider>
```

The corresponding Preact, Solid, Svelte, and Angular adapters use their native
restore mechanisms. Vue applications can pass broadcastQueryClientRestore
through the Vue plugin's clientPersister option. Lit currently has no restore
gate; await the returned promise before creating query controllers.

### `broadcastQueryClient`

Pass this function a `QueryClient` instance and optionally, a `broadcastChannel`.

```tsx
broadcastQueryClient({ queryClient, broadcastChannel })
```

### `Options`

An object of options:

```tsx
interface BroadcastQueryClientOptions {
  /** The QueryClient to sync */
  queryClient: QueryClient
  /** This is the unique channel name that will be used
   * to communicate between tabs and windows */
  broadcastChannel?: string
  /** Options for the BroadcastChannel API */
  options?: BroadcastChannelOptions
  /**
   * Called when a query event fails to broadcast to other tabs — most
   * commonly because the query's data, error, or key contains a value the
   * structured-clone algorithm cannot serialize (e.g. `ReadableStream`,
   * `File`, functions, Vue `reactive` proxies).
   *
   * If omitted, a `console.warn` is emitted in development so failures
   * are never entirely silent. May return a `Promise`; any rejection is
   * caught internally.
   */
  onBroadcastError?: (
    error: unknown,
    event: BroadcastErrorEvent,
  ) => void | Promise<void>
  /** Whether a live-sync session may answer cache bootstrap requests. */
  respondToCacheRequests?: boolean
  /** Used when this session answers cache bootstrap requests. */
  dehydrateOptions?: Pick<DehydrateOptions, 'shouldDehydrateQuery'>
  /** Called for bootstrap request, response, or hydration failures. */
  onBroadcastRestoreError?: (
    error: unknown,
    event: BroadcastRestoreErrorEvent,
  ) => void | Promise<void>
}

interface BroadcastErrorEvent {
  type: 'updated' | 'removed' | 'added'
  queryHash: string
  queryKey: QueryKey
}

interface BroadcastRestoreErrorEvent {
  type: 'request' | 'response' | 'hydrate'
  requestId: string
  responderId?: string
  responseId?: string
  queryHash?: string
  queryKey?: QueryKey
}

interface BroadcastQueryClientRestoreOptions extends Omit<
  BroadcastQueryClientOptions,
  'respondToCacheRequests'
> {
  timeout?: number
  hydrateOptions?: HydrateOptions
}
```

Existing `broadcastQueryClient` sessions do not answer bootstrap requests by
default. A live-sync session can explicitly opt in when it should provide
snapshots to restoring tabs. `broadcastQueryClientRestore` is already a
responder and does not accept `respondToCacheRequests`:

```tsx
broadcastQueryClient({
  queryClient,
  broadcastChannel: 'my-app',
  respondToCacheRequests: true,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => query.queryKey[0] !== 'private',
  },
})
```

The default options are:

```tsx
{
  broadcastChannel = 'tanstack-query',
}
```

## Handling broadcast errors

If your cache can hold values that are not structured-cloneable — such as `ReadableStream` (from `Response.body`, streaming APIs, or AI SDKs), `File`, functions, or framework proxies like Vue `reactive` — the underlying `BroadcastChannel.postMessage` call will reject for that query. Cross-tab sync is skipped for that query; the rest of the cache continues to broadcast normally.

By default, a `console.warn` is emitted in development so failures are never silent. Provide `onBroadcastError` to route failures to your own error tracker:

```tsx
import * as Sentry from '@sentry/browser'
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'

broadcastQueryClient({
  queryClient,
  broadcastChannel: 'my-app',
  onBroadcastError: (error, event) => {
    Sentry.captureException(error, {
      tags: { broadcastEvent: event.type },
      extra: { queryHash: event.queryHash, queryKey: event.queryKey },
    })
  },
})
```

The restore API additionally accepts timeout, query dehydration filtering,
hydrate options, and onBroadcastRestoreError. Restore errors are reported
separately from the existing live-sync onBroadcastError callback so existing
callbacks retain their current type and behavior.

The default timeout is 1000ms. A longer window improves the chance of receiving
the freshest state from an available responder session but increases cold-start
latency when no responder exists. A timeout of 0 does not wait for responses.

For bootstrap failures, use onBroadcastRestoreError:

```tsx
broadcastQueryClientRestore({
  queryClient,
  broadcastChannel: 'my-app',
  onBroadcastRestoreError: (error, event) => {
    Sentry.captureException(error, {
      tags: { broadcastEvent: event.type },
      extra: {
        requestId: event.requestId,
        queryHash: event.queryHash,
      },
    })
  },
})
```
