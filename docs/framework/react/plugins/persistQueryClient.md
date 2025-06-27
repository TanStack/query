---
id: persistQueryClient
title: persistQueryClient
---

This is set of utilities for interacting with "persisters" which save your queryClient for later use. Different **persisters** can be used to store your client and cache to many different storage layers.

## Build Persisters

- [createSyncStoragePersister](../createSyncStoragePersister.md)
- [createAsyncStoragePersister](../createAsyncStoragePersister.md)
- [create a custom persister](#persisters)

## How It Works

**IMPORTANT** - for persist to work properly, you probably want to pass `QueryClient` a `gcTime` value to override the default during hydration (as shown above).

If it is not set when creating the `QueryClient` instance, it will default to `300000` (5 minutes) for hydration, and the stored cache will be discarded after 5 minutes of inactivity. This is the default garbage collection behavior.

It should be set as the same value or higher than persistQueryClient's `maxAge` option. E.g. if `maxAge` is 24 hours (the default) then `gcTime` should be 24 hours or higher. If lower than `maxAge`, garbage collection will kick in and discard the stored cache earlier than expected.

You can also pass it `Infinity` to disable garbage collection behavior entirely.

Due to a Javascript limitation, the maximum allowed `gcTime` is about 24 days (see [more](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value)).

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})
```

### Cache Busting

Sometimes you may make changes to your application or data that immediately invalidate any and all cached data. If and when this happens, you can pass a `buster` string option. If the cache that is found does not also have that buster string, it will be discarded. The following several functions accept this option:

```tsx
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

- Your query/mutation are [`dehydrated`](../../reference/hydration.md#dehydrate) and stored by the persister you provided.
- `createSyncStoragePersister` and `createAsyncStoragePersister` throttle this action to happen at most every 1 second to save on potentially expensive writes. Review their documentation to see how to customize their throttle timing.

You can use this to explicitly persist the cache at the moment(s) you choose.

```tsx
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

```tsx
persistQueryClientSubscribe({
  queryClient,
  persister,
  buster = '',
  dehydrateOptions = undefined,
})
```

### `persistQueryClientRestore`

- Attempts to [`hydrate`](../../reference/hydration.md#hydrate) a previously persisted dehydrated query/mutation cache from the persister back into the query cache of the passed query client.
- If a cache is found that is older than the `maxAge` (which by default is 24 hours), it will be discarded. This timing can be customized as you see fit.

You can use this to restore the cache at moment(s) you choose.

```tsx
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

```tsx
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

```tsx
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

## Usage with React

[persistQueryClient](#persistQueryClient) will try to restore the cache and automatically subscribes to further changes, thus syncing your client to the provided storage.

However, restoring is asynchronous, because all persisters are async by nature, which means that if you render your App while you are restoring, you might get into race conditions if a query mounts and fetches at the same time.

Further, if you subscribe to changes outside of the React component lifecycle, you have no way of unsubscribing:

```tsx
// 🚨 never unsubscribes from syncing
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
})

// 🚨 happens at the same time as restoring
ReactDOM.createRoot(rootElement).render(<App />)
```

### PersistQueryClientProvider

For this use-case, you can use the `PersistQueryClientProvider`. It will make sure to subscribe / unsubscribe correctly according to the React component lifecycle, and it will also make sure that queries will not start fetching while we are still restoring. Queries will still render though, they will just be put into `fetchingState: 'idle'` until data has been restored. Then, they will refetch unless the restored data is _fresh_ enough, and _initialData_ will also be respected. It can be used _instead of_ the normal [QueryClientProvider](../../reference/QueryClientProvider.md):

```tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

ReactDOM.createRoot(rootElement).render(
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister }}
  >
    <App />
  </PersistQueryClientProvider>,
)
```

#### Props

`PersistQueryClientProvider` takes the same props as [QueryClientProvider](../../reference/QueryClientProvider.md), and additionally:

- `persistOptions: PersistQueryClientOptions`
  - all [options](#options) you can pass to [persistQueryClient](#persistqueryclient) minus the QueryClient itself
- `onSuccess?: () => Promise<unknown> | unknown`
  - optional
  - will be called when the initial restore is finished
  - can be used to [resumePausedMutations](../../../../reference/QueryClient.md#queryclientresumepausedmutations)
  - if a Promise is returned, it will be awaited; restoring is seen as ongoing until then
- `onError?: () => Promise<unknown> | unknown`
  - optional
  - will be called when an error is thrown during restoration
  - if a Promise is returned, it will be awaited

### useIsRestoring

If you are using the `PersistQueryClientProvider`, you can also use the `useIsRestoring` hook alongside it to check if a restore is currently in progress. `useQuery` and friends also check this internally to avoid race conditions between the restore and mounting queries.

## Persisters

### Persisters Interface

Persisters have the following interfaces:

```tsx
export interface Persister {
  persistClient(persistClient: PersistedClient): Promisable<void>
  restoreClient(): Promisable<PersistedClient | undefined>
  removeClient(): Promisable<void>
}
```

Persisted Client entries have the following interface:

```tsx
export interface PersistedClient {
  timestamp: number
  buster: string
  clientState: DehydratedState
}
```

You can import these (to build a persister):

```tsx
import {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client'
```

### Building A Persister

You can persist however you like. Here is an example of how to build an [Indexed DB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) persister. Compared to `Web Storage API`, Indexed DB is faster, stores more than 5MB, and doesn't require serialization. That means it can readily store Javascript native types, such as `Date` and `File`.

```tsx
import { get, set, del } from 'idb-keyval'
import {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client'

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client)
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey)
    },
    removeClient: async () => {
      await del(idbValidKey)
    },
  } satisfies Persister
}
```
