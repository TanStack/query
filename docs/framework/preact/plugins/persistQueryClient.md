---
id: persistQueryClient
title: persistQueryClient
---

This is set of utilities for interacting with "persisters" which save your queryClient for later use. Different **persisters** can be used to store your client and cache to many different storage layers.

## Build Persisters

- [createSyncStoragePersister](./createSyncStoragePersister.md)
- [createAsyncStoragePersister](./createAsyncStoragePersister.md)
- [create a custom persister](#persisters)

## How It Works

**IMPORTANT** - for persist to work properly, you probably want to pass `QueryClient` a `gcTime` value to override the default during hydration (as shown above).

If it is not set when creating the `QueryClient` instance, it will default to `300000` (5 minutes) for hydration, and the stored cache will be discarded after 5 minutes of inactivity. This is the default garbage collection behavior.

It should be set as the same value or higher than persistQueryClient's `maxAge` option. E.g. if `maxAge` is 24 hours (the default) then `gcTime` should be 24 hours or higher. If lower than `maxAge`, garbage collection will kick in and discard the stored cache earlier than expected.

You can also pass it `Infinity` to disable garbage collection behavior entirely.

```tsx
import { QueryClient } from '@tanstack/preact-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})
```

### Cache Busting

Sometimes you may make changes to your application or data that immediately invalidate any and all cached data. If and when this happens, you can pass a `buster` string option. If cache that is found does not also have that buster string, it will be discarded. The following several functions accept this option:

```tsx
import { persistQueryClient } from '@tanstack/preact-query-persist-client'

persistQueryClient({ queryClient, persister, buster: buildHash })
persistQueryClientSave({ queryClient, persister, buster: buildHash })
persistQueryClientRestore({ queryClient, persister, buster: buildHash })
```

## PersistQueryClientProvider

The easiest way to integrate persistence is by wrapping your app with `PersistQueryClientProvider`:

```tsx
import { PersistQueryClientProvider } from '@tanstack/preact-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const persister = createSyncStoragePersister(localStorage)

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <RestOfYourApp />
    </PersistQueryClientProvider>
  )
}
```

## Manual Persistence

For more control, you can use the manual functions:

```tsx
import {
  persistQueryClientSave,
  persistQueryClientRestore,
  persistQueryClientRemove,
} from '@tanstack/preact-query-persist-client'

// Save current cache state
await persistQueryClientSave({ queryClient, persister })

// Restore cache state
await persistQueryClientRestore({ queryClient, persister })

// Remove persisted cache
await persistQueryClientRemove({ persister })
```

## Persisters

### Custom Persister

You can create your own persister by implementing the persister interface:

```tsx
interface Persister {
  persistClient(persistClient: PersistClient): Promise<void>
  restoreClient(persistClient: PersistClient): Promise<RestoreResult>
  removeClient(persistClient: PersistClient): Promise<void>
}

const customPersister: Persister = {
  persistClient: async ({ client, serialize, filters }) => {
    // Custom persistence logic
    const serialized = serialize(client)
    await customStorage.setItem('query-client', serialized)
  },

  restoreClient: async ({ client, deserialize }) => {
    // Custom restoration logic
    const stored = await customStorage.getItem('query-client')
    if (stored) {
      return deserialize(stored, client)
    }
    return { client }
  },

  removeClient: async () => {
    // Custom removal logic
    await customStorage.removeItem('query-client')
  },
}
```

## Configuration Options

```tsx
const persistOptions = {
  persister: customPersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  buster: 'v1',                       // Cache busting string
  serialize: JSON.stringify,               // Custom serializer
  deserialize: JSON.parse,                 // Custom deserializer
}

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={persistOptions}
>
  <App />
</PersistQueryClientProvider>
```

## Removal Conditions

If data is found to be any of the following:

1. expired (see `maxAge`)
2. Buster mismatch
3. Serialization errors

The cache will be removed during restoration and a fresh client state will be used.

## Best Practices

### 1. Set Appropriate gcTime

```tsx
// Good: Match or exceed maxAge
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
})

// Ensure maxAge is equal or lower
const persister = createSyncStoragePersister(localStorage, {
  maxAge: 1000 * 60 * 60 * 24, // 24 hours or less
})
```

### 2. Use Cache Busting for Updates

```tsx
const persisterOptions = {
  persister,
  buster: `${appVersion}-${buildHash}`, // Invalidate on version/build changes
}
```

### 3. Handle Persistence Errors

```tsx
try {
  await persistQueryClientRestore({ queryClient, persister })
} catch (error) {
  console.error('Failed to restore cache:', error)
  // Continue with empty cache
}
```

### 4. Selective Persistence

```tsx
const persister = createSyncStoragePersister(localStorage, {
  filters: {
    // Only persist successful queries
    predicate: (query) => query.state.status === 'success',
  },
})
```

For more information on persisters and configuration options, see:

- [createSyncStoragePersister](./createSyncStoragePersister.md)
- [createAsyncStoragePersister](./createAsyncStoragePersister.md)
- [Persistence Guide](../guides/persistence.md)
