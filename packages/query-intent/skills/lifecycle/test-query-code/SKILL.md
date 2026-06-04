---
name: lifecycle/test-query-code
description: >
  Use this when testing TanStack Query code with isolated QueryClient instances,
  test providers, retry false, cache cleanup, async assertions, hook testing,
  React/Vue/Solid/Angular harnesses, and deterministic query state.
type: lifecycle
library: TanStack Query
library_version: "5.101.0"
requires:
  - lifecycle/setup-query-client-and-providers
  - core/tune-defaults-freshness-retries-and-refetching
sources:
  - TanStack/query:docs/framework/react/guides/testing.md
  - TanStack/query:docs/framework/solid/guides/testing.md
  - TanStack/query:docs/framework/vue/guides/testing.md
  - TanStack/query:docs/framework/angular/guides/testing.md
  - TanStack/query:packages/query-core/src/__tests__/queryClient.test.tsx
  - TanStack/query:packages/react-query/src/__tests__/useQuery.test.tsx
---

## Setup

```tsx
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return function TestWrapper(props: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
  }
}
```

## Core Patterns

### Create a client per test

```ts
import { QueryClient } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}
```

### Await async state

```ts
import { QueryClient } from '@tanstack/react-query'

export async function loadTodosForTest() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return queryClient.fetchQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
}
```

### Clear after direct client tests

```ts
import { QueryClient } from '@tanstack/react-query'

export function dispose(queryClient: QueryClient) {
  queryClient.clear()
}
```

## Common Mistakes

### CRITICAL Shared test client

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}
```

A shared client leaks cache and mutation state across tests.

Source: TanStack/query:docs/framework/react/guides/testing.md

### HIGH Retry backoff in tests

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

Default retries delay failure and make tests look hung.

Source: TanStack/query:docs/framework/react/guides/testing.md

### HIGH Asserting before async success

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
const promise = queryClient.fetchQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
console.log(queryClient.getQueryData(['todos']))
await promise
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()
await queryClient.fetchQuery({ queryKey: ['todos'], queryFn: async () => [{ id: 1 }] })
console.log(queryClient.getQueryData(['todos']))
```

Query state is asynchronous; assert after the query promise resolves or the UI wait completes.

Source: TanStack/query:docs/framework/react/guides/testing.md

