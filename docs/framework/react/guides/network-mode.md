---
id: network-mode
title: Network Mode
---

TanStack Query provides three different network modes to distinguish how [Queries](./queries) and [Mutations](./mutations) should behave if you have no network connection. This mode can be set for each Query / Mutation individually, or globally via the query / mutation defaults.

Since TanStack Query is most often used for data fetching in combination with data fetching libraries, the default network mode is [online](#network-mode-online).

## Network Mode: online

In this mode, Queries and Mutations will not fire unless you have network connection. This is the default mode. If a fetch is initiated for a query, it will always stay in the `state` (`pending`, `error`, `success`) it is in if the fetch cannot be made because there is no network connection. However, a [fetchStatus](./queries#fetchstatus) is exposed additionally. This can be either:

- `fetching`: The `queryFn` is really executing - a request is in-flight.
- `paused`: The query is not executing - it is `paused` until you have connection again
- `idle`: The query is not fetching and not paused

The flags `isFetching` and `isPaused` are derived from this state and exposed for convenience.

> Keep in mind that it might not be enough to check for `pending` state to show a loading spinner. Queries can be in `state: 'pending'`, but `fetchStatus: 'paused'` if they are mounting for the first time, and you have no network connection.

If a query runs because you are online, but you go offline while the fetch is still happening, TanStack Query will also pause the retry mechanism. Paused queries will then continue to run once you re-gain network connection. This is independent of `refetchOnReconnect` (which also defaults to `true` in this mode), because it is not a `refetch`, but rather a `continue`. If the query has been [cancelled](./query-cancellation) in the meantime, it will not continue.

## Network Mode: always

In this mode, TanStack Query will always fetch and ignore the online / offline state. This is likely the mode you want to choose if you use TanStack Query in an environment where you don't need an active network connection for your Queries to work - e.g. if you just read from `AsyncStorage`, or if you just want to return `Promise.resolve(5)` from your `queryFn`.

- Queries will never be `paused` because you have no network connection.
- Retries will also not pause - your Query will go to `error` state if it fails.
- `refetchOnReconnect` defaults to `false` in this mode, because reconnecting to the network is not a good indicator anymore that stale queries should be refetched. You can still turn it on if you want.

## Network Mode: offlineFirst

This mode is the middle ground between the first two options, where TanStack Query will run the `queryFn` once, but then pause retries. This is very handy if you have a serviceWorker that intercepts a request for caching like in an [offline-first PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers), or if you use HTTP caching via the [Cache-Control header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#the_cache-control_header).

In those situations, the first fetch might succeed because it comes from an offline storage / cache. However, if there is a cache miss, the network request will go out and fail, in which case this mode behaves like an `online` query - pausing retries.

## Devtools

The [TanStack Query Devtools](../devtools) will show Queries in a `paused` state if they would be fetching, but there is no network connection. There is also a toggle button to _Mock offline behavior_. Please note that this button will _not_ actually mess with your network connection (you can do that in the browser devtools), but it will set the [OnlineManager](../../../reference/onlineManager) in an offline state.

## Signature

- `networkMode: 'online' | 'always' | 'offlineFirst'`
  - optional
  - defaults to `'online'`
