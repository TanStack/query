---
id: createSyncStoragePersister
title: createSyncStoragePersister
---

## Deprecated

This plugin is deprecated and will be removed in the next major version.
You can simply use [`@tanstack/query-async-storage-persister`](./createAsyncStoragePersister.md) instead.

## Installation

This utility comes as a separate package and is available under the `'@tanstack/query-sync-storage-persister'` import.

```bash
npm install @tanstack/query-sync-storage-persister @tanstack/preact-query-persist-client
```

or

```bash
pnpm add @tanstack/query-sync-storage-persister @tanstack/preact-query-persist-client
```

or

```bash
yarn add @tanstack/query-sync-storage-persister @tanstack/preact-query-persist-client
```

or

```bash
bun add @tanstack/query-sync-storage-persister @tanstack/preact-query-persist-client
```

## Usage

- Import the `createSyncStoragePersister` function
- Create a new syncStoragePersister
- Pass it to the [`persistQueryClient`](./persistQueryClient.md) function

```tsx
import { persistQueryClient } from '@tanstack/preact-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const syncStoragePersister = createSyncStoragePersister(
  (key: string) => {
    // For browser localStorage
    return localStorage.getItem(key)
  },
  {
    key: 'cachedQueries',
    throttle: 1000,
  },
)

// Save current client state to localStorage
await persistQueryClientSave({
  queryClient,
  persister: syncStoragePersister,
})
```

## Storage Interfaces

### Browser localStorage

```tsx
const localStoragePersister = createSyncStoragePersister(
  (key) => localStorage.getItem(key),
  {
    key: 'tanstack-query',
    throttle: 1000,
  },
)
```

### Custom Storage Implementation

You can create your own storage that implements the sync storage interface:

```tsx
interface SyncStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

const customStorage: SyncStorage = {
  getItem: (key) => {
    // Custom get logic
    return sessionStorage.getItem(key)
  },
  setItem: (key, value) => {
    // Custom set logic
    return sessionStorage.setItem(key, value)
  },
  removeItem: (key) => {
    // Custom remove logic
    return sessionStorage.removeItem(key)
  },
}

const customPersister = createSyncStoragePersister(customStorage)
```

## Configuration Options

The `createSyncStoragePersister` accepts a second argument with configuration options:

```tsx
const syncStoragePersister = createSyncStoragePersister(storage, {
  key: 'persisterKey', // Storage key prefix
  throttle: 1000, // Throttle time in ms
  serialize: JSON.stringify, // Custom serialize function
  deserialize: JSON.parse, // Custom deserialize function
  maxAge: 1000 * 60 * 5, // Maximum age in ms (5 minutes)
  buster: 'v1', // Cache buster for version changes
})
```

## Migration to Async Storage

To migrate from sync to async storage persister:

```tsx
// Old: Sync storage
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

// New: Async storage
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

// Replace sync with async for better compatibility
const asyncStoragePersister = createAsyncStoragePersister({
  getItem: async (key) => {
    return localStorage.getItem(key)
  },
  setItem: async (key, value) => {
    return localStorage.setItem(key, value)
  },
  removeItem: async (key) => {
    return localStorage.removeItem(key)
  },
})

// Same API as sync persister
persistQueryClientSave({
  queryClient,
  persister: asyncStoragePersister,
})
```

## Browser Compatibility

This persister works with all modern browsers that support:

- `localStorage` for persistent storage
- `sessionStorage` for session-based storage
- Custom storage implementations

For mobile or async environments, use [`createAsyncStoragePersister`](./createAsyncStoragePersister.md) instead.

## Migration from React

If you're migrating from React Query to Preact Query, you only need to:

1. Update imports to use `@tanstack/preact-query-persist-client` instead of `@tanstack/react-query-persist-client`
2. Use the same `createSyncStoragePersister` function from `@tanstack/query-sync-storage-persister`
3. All other APIs remain the same

For more information on persisters and alternatives, see:

- [createAsyncStoragePersister](./createAsyncStoragePersister.md)
- [persistQueryClient](./persistQueryClient.md)
