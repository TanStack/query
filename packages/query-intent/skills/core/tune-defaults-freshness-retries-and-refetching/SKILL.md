---
name: core/tune-defaults-freshness-retries-and-refetching
description: >
  Use this when configuring staleTime, gcTime, cache lifetime, retry, retryDelay,
  refetchOnWindowFocus, refetchOnReconnect, refetchInterval, networkMode,
  focusManager, onlineManager, timeoutManager, or QueryClient defaultOptions.
type: core
library: TanStack Query
library_version: "5.101.0"
requires:
  - core/fetch-and-observe-queries
sources:
  - TanStack/query:docs/framework/react/guides/important-defaults.md
  - TanStack/query:docs/framework/react/guides/caching.md
  - TanStack/query:docs/framework/react/guides/query-retries.md
  - TanStack/query:docs/framework/react/guides/window-focus-refetching.md
  - TanStack/query:docs/framework/react/guides/network-mode.md
  - TanStack/query:docs/reference/focusManager.md
  - TanStack/query:docs/reference/onlineManager.md
  - TanStack/query:docs/reference/timeoutManager.md
---

## Setup

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})
```

## Core Patterns

### Set freshness close to the data source

```ts
import { queryOptions } from '@tanstack/react-query'

export const settingsOptions = queryOptions({
  queryKey: ['settings'],
  queryFn: async () => ({ theme: 'system' }),
  staleTime: 5 * 60_000,
})
```

### Disable retries in tests

```ts
import { QueryClient } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}
```

### Use networkMode deliberately

```ts
import { queryOptions } from '@tanstack/react-query'

export const metricsOptions = queryOptions({
  queryKey: ['metrics'],
  queryFn: async () => ({ count: 1 }),
  networkMode: 'online',
})
```

## Common Mistakes

### HIGH Confusing gcTime with freshness

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: async () => ({ name: 'Tanner' }), gcTime: 60_000 })
}
```

Correct:

```ts
import { useQuery } from '@tanstack/react-query'

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: async () => ({ name: 'Tanner' }), staleTime: 60_000 })
}
```

`gcTime` controls unused cache retention; `staleTime` controls whether cached data is considered fresh.

Source: TanStack/query:docs/framework/react/guides/important-defaults.md

### HIGH static staleTime blocks invalidation expectations

Wrong:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }], staleTime: 'static' })
}
```

Correct:

```ts
import { useQuery } from '@tanstack/react-query'

export function useTodos() {
  return useQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }], staleTime: 60_000 })
}
```

`staleTime: 'static'` opts out of refetching even when the query is invalidated.

Source: TanStack/query:docs/framework/react/guides/important-defaults.md

### HIGH Tests hang on retries

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})
```

Default retries add delay and can make failing tests wait before surfacing errors.

Source: TanStack/query:docs/framework/react/guides/testing.md

See also: `compositions/persist-offline-and-restore-caches` for persistence rules that depend on gcTime and networkMode.

