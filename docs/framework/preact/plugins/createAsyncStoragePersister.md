---
id: createAsyncStoragePersister
title: createAsyncStoragePersister
---

## Installation

This utility comes as a separate package and is available under the `'@tanstack/query-async-storage-persister'` import.

```bash
npm install @tanstack/query-async-storage-persister @tanstack/preact-query-persist-client
```

or

```bash
pnpm add @tanstack/query-async-storage-persister @tanstack/preact-query-persist-client
```

or

```bash
yarn add @tanstack/query-async-storage-persister @tanstack/preact-query-persist-client
```

or

```bash
bun add @tanstack/query-async-storage-persister @tanstack/preact-query-persist-client
```

## Usage

- Import the `createAsyncStoragePersister` function
- Create a new asyncStoragePersister
  - you can pass any `storage` to it that adheres to `AsyncStorage` interface - example below uses async-storage from React Native or Capacitor.
  - storages that read and write synchronously, like `window.localstorage`, also adhere to the `AsyncStorage` interface and can therefore also be used with `createAsyncStoragePersister`.
- Wrap your app by using [`PersistQueryClientProvider`](./persistQueryClient.md#persistqueryclientprovider) component.

```tsx
import { PersistQueryClientProvider } from '@tanstack/preact-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const asyncStoragePersister = createAsyncStoragePersister(
  (async) => {
    // For React Native
    return AsyncStorage
  },
  {
    key: 'cachedQueries',
    throttle: 1000,
  },
)

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <RestOfYourApp />
    </PersistQueryClientProvider>
  )
}
```

## Storage Interfaces

### React Native AsyncStorage

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'

const asyncStoragePersister = createAsyncStoragePersister(AsyncStorage)
```

### Capacitor Storage

```tsx
import { Preferences } from '@capacitor/preferences'

const capacitorStorage = {
  getItem: async (key: string) => {
    return await Preferences.get({ key }).then((result) => result.value)
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value })
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key })
  },
}

const asyncStoragePersister = createAsyncStoragePersister(capacitorStorage)
```

### Custom Storage Implementation

You can create your own storage implementation:

```tsx
interface AsyncStorage {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

const customStorage: AsyncStorage = {
  getItem: async (key) => {
    // Custom get logic
    return localStorage.getItem(key)
  },
  setItem: async (key, value) => {
    // Custom set logic
    return localStorage.setItem(key, value)
  },
  removeItem: async (key) => {
    // Custom remove logic
    return localStorage.removeItem(key)
  },
}

const asyncStoragePersister = createAsyncStoragePersister(customStorage)
```

## Configuration Options

The `createAsyncStoragePersister` accepts a second argument with configuration options:

```tsx
const asyncStoragePersister = createAsyncStoragePersister(storage, {
  key: 'persisterKey', // Storage key prefix
  throttle: 1000, // Throttle time in ms
  serialize: JSON.stringify, // Custom serialize function
  deserialize: JSON.parse, // Custom deserialize function
  maxAge: 1000 * 60 * 5, // Maximum age in ms (5 minutes)
  buster: 'v1', // Cache buster for version changes
})
```

## Migration from React

If you're migrating from React Query to Preact Query, the only changes needed are:

1. Update imports to use `@tanstack/preact-query-persist-client` instead of `@tanstack/react-query-persist-client`
2. Use the same `createAsyncStoragePersister` function from `@tanstack/query-async-storage-persister`
3. All other APIs remain the same

## Use Cases

- **Mobile Apps**: Persist queries across app restarts in React Native or Capacitor apps
- **Hybrid Apps**: Store queries in native storage for better performance
- **PWAs**: Use IndexedDB or similar storage APIs for persistence
- **Offline Support**: Cache queries for offline functionality

For more information on persisters and options, see:

- [Persistence Overview](../guides/persistence.md)
- [persistQueryClient](./persistQueryClient.md)
