---
name: compositions/persist-offline-and-restore-caches
description: >
  Use this when using persistQueryClient, PersistQueryClientProvider,
  createSyncStoragePersister, createAsyncStoragePersister, experimental
  fine-grained persisters, offline mutations, resumePausedMutations, maxAge,
  gcTime, and restore races.
type: composition
library: TanStack Query
library_version: "5.101.0"
requires:
  - lifecycle/setup-query-client-and-providers
  - core/tune-defaults-freshness-retries-and-refetching
  - core/write-mutations-and-invalidate-related-queries
sources:
  - TanStack/query:docs/framework/react/plugins/persistQueryClient.md
  - TanStack/query:docs/framework/react/plugins/createSyncStoragePersister.md
  - TanStack/query:docs/framework/react/plugins/createAsyncStoragePersister.md
  - TanStack/query:docs/framework/react/plugins/createPersister.md
  - TanStack/query:docs/framework/react/guides/network-mode.md
---

## Setup

```tsx
import * as React from 'react'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 24 * 60 * 60 * 1000 } },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

export function AppProviders(props: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {props.children}
    </PersistQueryClientProvider>
  )
}
```

## Core Integration Patterns

### Resume paused mutations after restore

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()

queryClient.setMutationDefaults(['todos'], {
  mutationFn: async (todo: { id: number; title: string }) => todo,
})

export function resumeMutations() {
  return queryClient.resumePausedMutations()
}
```

### Align cache lifetime with persistence

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: 7 * 24 * 60 * 60 * 1000 },
  },
})
```

### Use networkMode for offline-first writes

```ts
import { useMutation } from '@tanstack/react-query'

export function useSaveDraft() {
  return useMutation({
    mutationKey: ['saveDraft'],
    mutationFn: async (draft: { body: string }) => draft,
    networkMode: 'offlineFirst',
  })
}
```

## Common Mistakes

### HIGH gcTime shorter than maxAge

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 5 * 60 * 1000 } },
})
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: 24 * 60 * 60 * 1000 } },
})
```

Persisted data can be garbage-collected before the persister maxAge can restore it.

Source: TanStack/query:docs/framework/react/plugins/persistQueryClient.md

### CRITICAL Rendering before restore

Wrong:

```tsx
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
export function App(props: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
}
```

Correct:

```tsx
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const queryClient = new QueryClient()
const persister = createSyncStoragePersister({ storage: window.localStorage })

export function App(props: { children: React.ReactNode }) {
  return <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>{props.children}</PersistQueryClientProvider>
}
```

The persistence provider prevents query fetching while restore is in progress.

Source: TanStack/query:docs/framework/react/plugins/persistQueryClient.md

### CRITICAL Missing default mutationFn

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
queryClient.setMutationDefaults(['saveDraft'], {
  mutationFn: async (draft: { body: string }) => draft,
})
```

Paused persisted mutations cannot resume without a serializable mutation key mapped to a default mutationFn.

Source: TanStack/query:docs/framework/react/plugins/persistQueryClient.md

See also: `core/tune-defaults-freshness-retries-and-refetching` for gcTime and networkMode.
