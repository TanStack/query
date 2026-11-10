---
id: persistQueryClient
title: persistQueryClient
---

`@tanstack/angular-query-persist-client` saves your `QueryClient` cache with a **persister** and restores it the next time the application starts. Different persisters can store the cache in different storage layers.

## Installation

```sh
npm install @tanstack/angular-query-persist-client
```

or

```sh
pnpm add @tanstack/angular-query-persist-client
```

or

```sh
yarn add @tanstack/angular-query-persist-client
```

or

```sh
bun add @tanstack/angular-query-persist-client
```

You also need a persister. `@tanstack/query-async-storage-persister` and `@tanstack/query-sync-storage-persister` provide persisters for the Web Storage API and compatible stores, or you can [build your own](#persisters).

## Usage

Add `withPersistQueryClient` to `provideTanStackQuery`:

```ts
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query'
import { withPersistQueryClient } from '@tanstack/angular-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import type { ApplicationConfig } from '@angular/core'

export const appConfig: ApplicationConfig = {
  providers: [
    provideTanStackQuery(
      () =>
        new QueryClient({
          defaultOptions: {
            queries: {
              gcTime: 24 * 60 * 60 * 1000, // 24 hours
            },
          },
        }),
      withPersistQueryClient(() => ({
        persistOptions: {
          persister: createAsyncStoragePersister({ storage: localStorage }),
        },
      })),
    ),
  ],
}
```

The options factory runs once per injector, in an injection context, and only in the browser. It can call `inject()` and use browser APIs such as `localStorage`. During server-side rendering the factory is not called and nothing is restored, so create persisters that access browser storage inside the factory.

When the injector is created in the browser, `withPersistQueryClient`:

1. Restores the persisted cache into the `QueryClient`.
2. Subscribes to the query cache and saves changes through the persister.
3. Stops saving when the injector is destroyed.

Restoring is asynchronous. Queries do not start fetching while the cache is being restored. They still render, with `fetchStatus: 'idle'`, until the data has been restored. Then they refetch unless the restored data is fresh enough. `initialData` is respected.

### Options

The factory returns an object with:

- `persistOptions: PersistQueryClientOptions`
  - all [options](#persistoptions) for persisting and restoring, minus the `QueryClient` itself
- `onSuccess?: () => Promise<unknown> | unknown`
  - optional
  - will be called when the initial restore is finished
  - can be used to [resumePausedMutations](../reference/classes/QueryClient.md#resumepausedmutations)
  - if a Promise is returned, it will be awaited; restoring is seen as ongoing until then
- `onError?: () => Promise<unknown> | unknown`
  - optional
  - will be called when an error is thrown during restoration
  - if a Promise is returned, it will be awaited

### `persistOptions`

```ts
interface PersistQueryClientOptions {
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

### injectIsRestoring

Use [`injectIsRestoring`](../reference/functions/injectIsRestoring.md) to check whether a restore is in progress. It returns a signal that is `true` while the cache is being restored. `injectQuery` and friends also check this internally to avoid race conditions between the restore and mounting queries.

```angular-ts
import { Component } from '@angular/core'
import { injectIsRestoring } from '@tanstack/angular-query'

@Component({
  selector: 'app-root',
  template: `
    @if (isRestoring()) {
      <p>Restoring the cache...</p>
    }
  `,
})
export class AppComponent {
  readonly isRestoring = injectIsRestoring()
}
```

## How It Works

**IMPORTANT** - for persist to work properly, you probably want to pass `QueryClient` a `gcTime` value to override the default during hydration (as shown above).

If it is not set when creating the `QueryClient` instance, it will default to `300000` (5 minutes) for hydration, and the stored cache will be discarded after 5 minutes of inactivity. This is the default garbage collection behavior.

It should be set as the same value or higher than the `maxAge` option. E.g. if `maxAge` is 24 hours (the default) then `gcTime` should be 24 hours or higher. If lower than `maxAge`, garbage collection will kick in and discard the stored cache earlier than expected.

You can also pass it `Infinity` to disable garbage collection behavior entirely.

Due to a JavaScript limitation, the maximum allowed `gcTime` is about [24 days](https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value), although it is possible to work around this limit using [timeoutManager.setTimeoutProvider](../reference/interfaces/TimeoutManager.md#settimeoutprovider).

### Cache Busting

Sometimes you may make changes to your application or data that immediately invalidate any and all cached data. If and when this happens, you can pass a `buster` string option. If the cache that is found does not also have that buster string, it will be discarded.

```ts
withPersistQueryClient(() => ({
  persistOptions: { persister, buster: buildHash },
}))
```

### Removal

If data is found to be any of the following:

1. expired (see `maxAge`)
2. busted (see `buster`)
3. error (ex: `throws ...`)
4. empty (ex: `undefined`)

the persister `removeClient()` is called and the cache is immediately discarded.

## Persisters

### Storage persisters

`createAsyncStoragePersister` accepts any storage that adheres to the `AsyncStorage` interface. Storages that read and write synchronously, like `window.localStorage`, also adhere to it.

```ts
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const persister = createAsyncStoragePersister({ storage: localStorage })
```

`createSyncStoragePersister` accepts a synchronous storage, such as `window.localStorage` or `window.sessionStorage`.

```ts
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const persister = createSyncStoragePersister({ storage: localStorage })
```

Both throttle saving to happen at most every 1 second to save on potentially expensive writes.

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
  clientState: DehydratedState
}
```

You can import these (to build a persister):

```ts
import {
  PersistedClient,
  Persister,
} from '@tanstack/angular-query-persist-client'
```

### Building A Persister

You can persist however you like. Here is an example of how to build an [Indexed DB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) persister. Compared to `Web Storage API`, Indexed DB is faster, stores more than 5MB, and doesn't require serialization. That means it can readily store Javascript native types, such as `Date` and `File`.

```ts
import { get, set, del } from 'idb-keyval'
import {
  PersistedClient,
  Persister,
} from '@tanstack/angular-query-persist-client'

/**
 * Creates an Indexed DB persister
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export function createIDBPersister(idbValidKey: IDBValidKey = 'angularQuery') {
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

## Examples

- [Persister](../examples/basic-persister)
- [SSR with persistence](../examples/ssr-persist)
