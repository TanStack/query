---
id: createWebStoragePersister
title: createWebStoragePersister
---

## Installation

This utility comes packaged with `react-query` and is available under the `react-query/createWebStoragePersister` import.

## Usage

- Import the `createWebStoragePersister` function
- Create a new webStoragePersister
- Pass it to the [`persistQueryClient`](./persistQueryClient) function

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

const localStoragePersister = createWebStoragePersister({ storage: window.localStorage })
// const sessionStoragePersister = createWebStoragePersister({ storage: window.sessionStorage })

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
})
```

## API

### `createWebStoragePersister`

Call this function to create a webStoragePersister that you can use later with `persistQueryClient`.

```js
createWebStoragePersister(options: CreateWebStoragePersisterOptions)
```

### `Options`

```ts
interface CreateWebStoragePersisterOptions {
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
import { QueryClient } from 'react-query';
import { persistQueryClient } from 'react-query/persistQueryClient'
import { createWebStoragePersister } from 'react-query/createWebStoragePersister'

import { compress, decompress } from 'lz-string';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });

persistQueryClient({
  queryClient: connectionsQueryClient,
  persistor: createWebStoragePersister({
    storage: window.localStorage,
    serialize: data => compress(JSON.stringify(data)),
    deserialize: data => JSON.parse(decompress(data)),
  }),
  maxAge: Infinity,
});
```
