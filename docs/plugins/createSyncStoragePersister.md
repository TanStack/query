---
id: createSyncStoragePersister
title: createSyncStoragePersister
---

## Installation

This utility comes as a separate package and is available under the `'@tanstack/query-sync-storage-persister'` import.

## Usage

- Import the `createSyncStoragePersister` function
- Create a new syncStoragePersister
- Pass it to the [`persistQueryClient`](./persistQueryClient) function

```ts
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

const localStoragePersister = createSyncStoragePersister({ storage: window.localStorage })
// const sessionStoragePersister = createSyncStoragePersister({ storage: window.sessionStorage })

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
})
```

## Retries

Persistence can fail, e.g. if the size exceeds the available space on the storage. Errors can be handled gracefully by providing a `retry` function to the persister.

The retry function receives the `persistedClient` it tried to save, as well as the `error` and the `errorCount` as input. It is expected to return a _new_ `PersistedClient`, with which it tries to persist again. If _undefined_ is returned, there will be no further attempt to persist.

```ts
export type PersistRetryer = (props: {
  persistedClient: PersistedClient
  error: Error
  errorCount: number
}) => PersistedClient | undefined
```

### Predefined strategies

Per default, no retry will occur. You can use one of the predefined strategies to handle retries. They can be imported `from '@tanstack/react-query-persist-client'`:

- `removeOldestQuery`
  - will return a new `PersistedClient` with the oldest query removed.

```js
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  retry: removeOldestQuery
})
```

## API

### `createSyncStoragePersister`

Call this function to create a syncStoragePersister that you can use later with `persistQueryClient`.

```js
createSyncStoragePersister(options: CreateSyncStoragePersisterOptions)
```

### `Options`

```ts
interface CreateSyncStoragePersisterOptions {
  /** The storage client used for setting an retrieving items from cache (window.localStorage or window.sessionStorage) */
  storage: Storage
  /** The key to use when storing the cache */
  key?: string
  /** To avoid spamming,
   * pass a time in ms to throttle saving the cache to disk */
  throttleTime?: number
  /** How to serialize the data to storage */
  serialize?: (client: PersistedClient) => string
  /** How to deserialize the data from storage */
  deserialize?: (cachedString: string) => PersistedClient
  /** How to retry persistence on error **/
  retry?: PersistRetryer
}
```

The default options are:

```js
{
  key = `REACT_QUERY_OFFLINE_CACHE`,
  throttleTime = 1000,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
}
```

#### `serialize` and `deserialize` options
There is a limit to the amount of data which can be stored in `localStorage`.
If you need to store more data in `localStorage`, you can override the `serialize` and `deserialize` functions to compress and decrompress the data using a library like [lz-string](https://github.com/pieroxy/lz-string/).

```js
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

import { compress, decompress } from 'lz-string';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

persistQueryClient({
  queryClient: connectionsQueryClient,
  persistor: createSyncStoragePersister({
    storage: window.localStorage,
    serialize: data => compress(JSON.stringify(data)),
    deserialize: data => JSON.parse(decompress(data)),
  }),
  maxAge: Infinity,
});
```
