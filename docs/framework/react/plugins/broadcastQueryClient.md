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
  /** Called when a query event cannot be broadcast to other tabs —
   * most commonly because the query's `state.data`, `state.error`, or
   * `queryKey` contains a value the structured-clone algorithm cannot
   * serialize (e.g. `ReadableStream`, `File`, functions, framework
   * proxies). Useful for routing failures to an error tracker. */
  onBroadcastError?: (error: unknown, event: BroadcastErrorEvent) => void
}

interface BroadcastErrorEvent {
  type: 'added' | 'removed' | 'updated'
  queryHash: string
  queryKey: QueryKey
}
```

The default options are:

```tsx
{
  broadcastChannel = 'tanstack-query',
}
```

### Handling broadcast errors

If your cache can hold values that are not structured-cloneable — such as `ReadableStream` (often coming from `Response.body` or streaming APIs), `File`, functions, or framework proxies like Vue `reactive` — the underlying `BroadcastChannel.postMessage` call will reject for that query. Cross-tab sync is skipped for that query; the rest of the cache continues to broadcast normally.

By default, a `console.warn` is emitted in development so failures are never silent. Provide `onBroadcastError` to route the failure to your own error tracker:

```tsx
import * as Sentry from '@sentry/browser'

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
