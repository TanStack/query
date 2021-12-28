---
id: persistQueryClient
title: persistQueryClient
---

`persistQueryClient` is a utility for persisting the state of your queryClient and its caches for later use. Different **persisters** can be used to store your client and cache to many different storage layers.

## Officially Supported Persisters

- [createWebStoragePersister](/plugins/createWebStoragePersister)
- [createAsyncStoragePersister](/plugins/createAsyncStoragePersister)

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/persistQueryClient` import.

## Usage

Import the `persistQueryClient` function, and pass it your `QueryClient` instance (with a `cacheTime` set), and a Persister interface (there are multiple persister types you can use):

```ts
import { persistQueryClient } from 'react-query/persistQueryClient'
import { createWebStoragePersister } from 'react-query/createWebStoragePersister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const localStoragePersister = createWebStoragePersister({
  storage: window.localStorage,
})

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
})
```

**IMPORTANT** - for persist to work properly, you need to pass `QueryClient` a `cacheTime` value to override the default during hydration (as shown above).

If it is not set when creating the `QueryClient` instance, it will default to `300000` (5 minutes) for hydration, and the stored cache will be discarded after 5 minutes of inactivity. This is the default garbage collection behavior.

It should be set as the same value or higher than persistQueryClient's `maxAge` option. E.g. if `maxAge` is 24 hours (the default) then `cacheTime` should be 24 hours or higher. If lower than `maxAge`, garbage collection will kick in and discard the stored cache earlier than expected.

You can also pass it `Infinity` to disable garbage collection behavior entirely.

## How does it work?

- A check for window `undefined` is performed prior to saving/restoring/removing your data (avoids build errors).

### Storing

As you use your application:

- When your query/mutation cache is updated, it will be [`dehydrated`](../reference/hydration#dehydrate) and stored by the persister you provided. The officially supported persisters throttle this action to happen at most every 1 second to save on potentially expensive writes, but can be customized as you see fit.

#### Cache Busting

Sometimes you may make changes to your application or data that immediately invalidate any and all cached data. If and when this happens, you can pass a `buster` string option to `persistQueryClient`, and if the cache that is found does not also have that buster string, it will be discarded.

```ts
persistQueryClient({ queryClient, persister, buster: buildHash })
```

### Restoring

When you reload/bootstrap your app:

- Attempts to [`hydrate`](../reference/hydration#hydrate) a previously persisted dehydrated query/mutation cache from the persister back into the query cache.
- If a cache is found that is older than the `maxAge` (which by default is 24 hours), it will be discarded. This can be customized as you see fit.

### Removal

- If data is found to be expired (see `maxAge`), busted (see `buster`), error (ex: `throws ...`), or empty (ex: `undefined`), the persister `removeClient()` is called and the cache is immediately discarded.

## API

### `persistQueryClientRestore`

This will attempt to restore a persister's stored cached to the active query cache.

```ts
persistQueryClientRestore({
  queryClient,
  persister,
  maxAge = 1000 * 60 * 60 * 24, // 24 hours
  buster = '',
  hydrateOptions,
})
```

### `persistQueryClientSave`

This will attempt to save the current query cache with the persister. You can use this to explicitly persist the cache at the moments you choose.

```ts
persistQueryClientSave({
  queryClient,
  persister,
  buster = '',
  dehydrateOptions,
})
```

### `persistQueryClientSubscribe`

This will subscribe to query cache updates which will run `persistQueryClientSave`. For example: you might initiate the `subscribe` when a user logs-in and checks "Remember me".

- It returns an `unsubscribe` function which you can use to discontinue the monitor; ending the updates to the persisted cache.
- If you want to erase the persisted cache after the `unsubscribe`, you can send a new `buster` to `persistQueryClientRestore` which will trigger the persister's `removeClient` function and discard the persisted cache.

```ts
persistQueryClientSubscribe({
  queryClient,
  persister,
  buster = '',
  dehydrateOptions,
})
```

### `persistQueryClient`

This will automatically restore any persisted cache and permanently subscribe to the query cache to persist any changes from the query cache to the persister.

```ts
persistQueryClient({
  queryClient,
  persister,
  maxAge = 1000 * 60 * 60 * 24, // 24 hours
  buster = '',
  hydrateOptions,
  dehydrateOptions,
})
```

### `Options`

An object of options:

```ts
interface PersistQueryClientOptions {
  /** The QueryClient to persist */
  queryClient: QueryClient
  /** The Persister interface for storing and restoring the cache
   * to/from a persisted location */
  persister: Persister
  /** The max-allowed age of the cache in milliseconds.
   * If a persisted cache is found that is older than this
   * time, it will be **silently** discarded
   * (defaults to 24 hours) */
  maxAge?: number
  /** A unique string that can be used to forcefully
   * invalidate existing caches if they do not share the same buster string */
  buster?: string
  /** The options passed to the hydrate function */
  hydrateOptions?: HydrateOptions
  /** The options passed to the dehydrate function */
  dehydrateOptions?: DehydrateOptions
}
```

## Building a Persister

Persisters have the following interface:

```ts
export interface Persister {
  persistClient(persistClient: PersistedClient): Promisable<void>
  restoreClient(): Promisable<PersistedClient | undefined>
  removeClient(): Promisable<void>
}
```

Persisted Client entries have the following interface:

```ts
export interface PersistedClient {
  timestamp: number
  buster: string
  cacheState: any
}
```

Satisfy all of these interfaces and you've got yourself a persister!
