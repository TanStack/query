---
id: network-mode
title: Network Mode
---

React Query provides three different network modes to distinguish how [Queries](./queries) and [Mutations](./mutations) should behave if you have no internet connection. This mode can be set for each Query / Mutation individually, or globally via the query / mutation defaults.

Since React Query is most often used for data fetching in combination with data fetching libraries, the default network mode is [online](#network-mode-online).

## Network Mode: online

In this mode, Queries and Mutations will not fire unless you have internet connection. This is the default mode

## Network Mode: always

In this mode, React Query will always fetch and ignore the online / offline state. This is likely the mode you want to choose if you use React Query in an environment where you don't need an active internet connection for your Queries to work - e.g. if you just read from `AsyncStorage`.

- Queries will never be `paused` because you have no internet connection.
- Retries will also not pause - your Query will go to `error` state if it fails.
- `refetchOnReconnect` defaults to `false` in this mode, because reconnecting to the network is not a good indicator anymore that stale queries should be refetched. You can still turn it on if you want.

## Network Mode: offlineFirst

## Devtools

The [React Query Devtools](../devtools) will show Queries in a `paused` state if they would be fetching, but there is no internet connection. There is also a toggle button to _Mock offline behavior_. Please note that this button will _not_ actually mess with your network connection (you can do that in the browser devtools), but it will set the [OnlineManager](../reference/onlineManager) in an offline state.

## Signature

- `networkMode: 'online' | 'always' | 'offlineFirst`
  - optional
  - defaults to `'online'`
