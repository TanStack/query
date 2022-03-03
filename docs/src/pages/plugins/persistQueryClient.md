---
id: persistQueryClient
title: persistQueryClient
---

This is set of utilities for interacting with "persisters" which save your queryClient for later use. Different **persisters** can be used to store your client and cache to many different storage layers.

## Build Persisters

- [createWebStoragePersister](/plugins/createWebStoragePersister)
- [createAsyncStoragePersister](/plugins/createAsyncStoragePersister)
- [create a custom persister](#persisters)

## How It Works

**IMPORTANT** - for persist to work properly, you probably want to pass `QueryClient` a `cacheTime` value to override the default during hydration (as shown above).

If it is not set when creating the `QueryClient` instance, it will default to `300000` (5 minutes) for hydration, and the stored cache will be discarded after 5 minutes of inactivity. This is the default garbage collection behavior.

It should be set as the same value or higher than persistQueryClient's `maxAge` option. E.g. if `maxAge` is 24 hours (the default) then `cacheTime` should be 24 hours or higher. If lower than `maxAge`, garbage collection will kick in and discard the stored cache earlier than expected.

You can also pass it `Infinity` to disable garbage collection behavior entirely.

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})
```

### Environment Checking
A check for window `undefined` is performed prior to saving/restoring/removing your data (avoids build errors).

### Cache Busting

Sometimes you may make changes to your application or data that immediately invalidate any and all cached data. If and when this happens, you can pass a `buster` string option. If the cache that is found does not also have that buster string, it will be discarded.  The following several functions accept this option:

```ts
persistQueryClient({ queryClient, persister, buster: buildHash })
persistQueryClientSave({ queryClient, persister, buster: buildHash })
persistQueryClientRestore({ queryClient, persister, buster: buildHash })
```

### Removal

If data is found to be any of the following:

1. expired (see `maxAge`)
2. busted (see `buster`)
3. error (ex: `throws ...`)
4. empty (ex: `undefined`)

the persister `removeClient()` is called and the cache is immediately discarded.

## API

### `persistQueryClientSave`

- Your query/mutation are [`dehydrated`](../reference/hydration#dehydrate) and stored by the persister you provided. 
- `createWebStoragePersister` and `createAsyncStoragePersister` throttle this action to happen at most every 1 second to save on potentially expensive writes.  Review their documentation to see how to customize their throttle timing. 

You can use this to explicitly persist the cache at the moment(s) you choose.

```ts
persistQueryClientSave({
  queryClient,
  persister,
  buster = '',
  dehydrateOptions = undefined,
})
```

### `persistQueryClientSubscribe`

Runs `persistQueryClientSave` whenever the cache changes for your `queryClient`. For example: you might initiate the `subscribe` when a user logs-in and checks "Remember me".

- It returns an `unsubscribe` function which you can use to discontinue the monitor; ending the updates to the persisted cache.
- If you want to erase the persisted cache after the `unsubscribe`, you can send a new `buster` to `persistQueryClientRestore` which will trigger the persister's `removeClient` function and discard the persisted cache.

```ts
persistQueryClientSubscribe({
  queryClient,
  persister,
  buster = '',
  dehydrateOptions = undefined,
})
```

### `persistQueryClientRestore`

- Attempts to [`hydrate`](../reference/hydration#hydrate) a previously persisted dehydrated query/mutation cache from the persister back into the query cache of the passed query client.
- If a cache is found that is older than the `maxAge` (which by default is 24 hours), it will be discarded. This timing can be customized as you see fit.

You can use this to restore the cache at moment(s) you choose.

```ts
persistQueryClientRestore({
  queryClient,
  persister,
  maxAge = 1000 * 60 * 60 * 24, // 24 hours
  buster = '',
  hydrateOptions = undefined,
})
```

### `persistQueryClient`

Takes the following actions:

1. Immediately restores any persisted cache ([see `persistQueryClientRestore`](#persistqueryclientrestore))
2. Subscribes to the query cache and returns the `unsubscribe` function ([see `persistQueryClientSubscribe`](#persistqueryclientsubscribe)).

This functionality is preserved from version 3.x.

```ts
persistQueryClient({
  queryClient,
  persister,
  maxAge = 1000 * 60 * 60 * 24, // 24 hours
  buster = '',
  hydrateOptions = undefined,
  dehydrateOptions = undefined,
})
```

### `Options`

All options available are as follows:

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
  /** The options passed to the hydrate function
   * Not used on `persistQueryClientSave` or `persistQueryClientSubscribe` */
  hydrateOptions?: HydrateOptions
  /** The options passed to the dehydrate function 
  * Not used on `persistQueryClientRestore` */
  dehydrateOptions?: DehydrateOptions
}
```

There are actually three interfaces available: 
- `PersistedQueryClientSaveOptions` is used for `persistQueryClientSave` and `persistQueryClientSubscribe` (doesn't use `hydrateOptions`).
- `PersistedQueryClientRestoreOptions` is used for `persistQueryClientRestore` (doesn't use `dehydrateOptions`).
- `PersistQueryClientOptions` is used for `persistQueryClient`

## Persisters

### Persisters Interface

Persisters have the following interfaces:

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

You can import these (to build a persister):
```ts
import { PersistedClient, Persister } from "react-query/persistQueryClient";
```

### Building A Persister
You can persist however you like.  Here is an example of how to build an [Indexed DB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) persister. Compared to `Web Storage API`, Indexed DB is faster, stores more than 5MB, and doesn't require serialization.  That means it can readily store Javascript native types, such as `Date` and `File`.

```ts
import { get, set, del } from "idb-keyval";
import { PersistedClient, Persister } from "react-query/persistQueryClient";

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
  return {
    persistClient: async (client: PersistedClient) => {
      set(idbValidKey, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  } as Persister;
}
```
