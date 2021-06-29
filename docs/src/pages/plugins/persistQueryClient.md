---
id: persistQueryClient
title: persistQueryClient (Experimental)
---

> VERY IMPORTANT: This utility is currently in an experimental stage. This means that breaking changes will happen in minor AND patch releases. Use at your own risk. If you choose to rely on this in production in an experimental stage, please lock your version to a patch-level version to avoid unexpected breakages.

`persistQueryClient` is a utility for persisting the state of your queryClient and its caches for later use. Different **persistors** can be used to store your client and cache to many different storage layers.

## Officially Supported Persistors

- [createWebStoragePersistor (Experimental)](/plugins/createWebStoragePersistor)
- [createAsyncStoragePersistor (Experimental)](/plugins/createAsyncStoragePersistor)

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/persistQueryClient-experimental` import.

## Usage

Import the `persistQueryClient` function, and pass it your `QueryClient` instance (with a `cacheTime` set), and a Persistor interface (there are multiple persistor types you can use):

```ts
import { persistQueryClient } from 'react-query/persistQueryClient-experimental'
import { createWebStoragePersistor } from 'react-query/createWebStoragePersistor-experimental'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const localStoragePersistor = createWebStoragePersistor({storage: window.localStorage})

persistQueryClient({
  queryClient,
  persistor: localStoragePersistor,
})
```

**IMPORTANT** - for persist to work properly, you need to pass `QueryClient` a `cacheTime` value to override the default during hydration (as shown above).

If it is not set when creating the `QueryClient` instance, it will default to `300000` (5 minutes) for hydration, and the stored cache will be discarded after 5 minutes of inactivity. This is the default garbage collection behavior.

It should be set as the same value or higher than persistQueryClient's `maxAge` option. E.g. if `maxAge` is 24 hours (the default) then `cacheTime` should be 24 hours or higher. If lower than `maxAge`, garbage collection will kick in and discard the stored cache earlier than expected.

You can also pass it `Infinity` to disable garbage collection behavior entirely.

## How does it work?

As you use your application:

- When your query/mutation cache is updated, it will be dehydrated and stored by the persistor you provided. **By default**, this action is throttled to happen at most every 1 second to save on potentially expensive writes to a persistor, but can be customized as you see fit.

When you reload/bootstrap your app:

- Attempts to load a previously persisted dehydrated query/mutation cache from the persistor
- If a cache is found that is older than the `maxAge` (which by default is 24 hours), it will be discarded. This can be customized as you see fit.

## Cache Busting

Sometimes you may make changes to your application or data that immediately invalidate any and all cached data. If and when this happens, you can pass a `buster` string option to `persistQueryClient`, and if the cache that is found does not also have that buster string, it will be discarded.

```ts
persistQueryClient({ queryClient, persistor, buster: buildHash })
```

## API

### `persistQueryClient`

Pass this function a `QueryClient` instance and a persistor that will persist your cache. Both are **required**

```ts
persistQueryClient({ queryClient, persistor })
```

### `Options`

An object of options:

```ts
interface PersistQueryClientOptions {
  /** The QueryClient to persist */
  queryClient: QueryClient
  /** The Persistor interface for storing and restoring the cache
   * to/from a persisted location */
  persistor: Persistor
  /** The max-allowed age of the cache.
   * If a persisted cache is found that is older than this
   * time, it will be discarded */
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

The default options are:

```ts
{
  maxAge = 1000 * 60 * 60 * 24, // 24 hours
  buster = '',
}
```

## Building a Persistor

Persistors have the following interface:

```ts
export interface Persistor {
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

Satisfy all of these interfaces and you've got yourself a persistor!
