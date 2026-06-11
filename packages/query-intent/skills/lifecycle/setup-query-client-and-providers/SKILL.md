---
name: lifecycle/setup-query-client-and-providers
description: >
  Use this when creating a TanStack Query QueryClient, QueryClientProvider, VueQueryPlugin,
  provideTanStackQuery, Svelte QueryClientProvider, Angular providers, Lit controllers, or
  SSR request-local clients. Covers stable client lifetime and provider wiring.
type: lifecycle
library: TanStack Query
library_version: '5.101.0'
sources:
  - TanStack/query:docs/framework/react/quick-start.md
  - TanStack/query:docs/framework/react/reference/QueryClientProvider.md
  - TanStack/query:docs/eslint/stable-query-client.md
  - TanStack/query:docs/framework/vue/guides/custom-client.md
  - TanStack/query:docs/framework/angular/overview.md
  - TanStack/query:docs/framework/lit/guides/reactive-controllers-vs-hooks.md
---

## Setup

```tsx
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function AppProviders(props: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}
```

## Core Patterns

### Create request-local SSR clients

```ts
import { QueryClient } from '@tanstack/react-query'

export function createServerQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  })
}
```

### Use adapter-native providers

```ts
import { QueryClient } from '@tanstack/query-core'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: 2 } },
  })
}
```

React and Preact use `QueryClientProvider`; Vue uses `VueQueryPlugin`; Angular uses `provideTanStackQuery`; Svelte and Lit use their adapter provider/controller APIs.

### Pass an explicit client at integration boundaries

```ts
import { QueryClient } from '@tanstack/query-core'

const queryClient = new QueryClient()

export function getTodos() {
  return queryClient.ensureQueryData({
    queryKey: ['todos'],
    queryFn: async () => [{ id: 1, title: 'Ship' }],
  })
}
```

## Common Mistakes

### CRITICAL New client on every render

Wrong:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function App(props: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}
```

Correct:

```tsx
import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function App(props: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient())
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  )
}
```

Recreating the client discards caches and subscriptions on render.

Source: TanStack/query:docs/eslint/stable-query-client.md

### CRITICAL Shared SSR cache between users

Wrong:

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()
```

Correct:

```ts
import { QueryClient } from '@tanstack/react-query'

export function createRequestQueryClient() {
  return new QueryClient()
}
```

A module-level server client can leak one request's cached data into another request.

Source: TanStack/query:docs/framework/react/guides/ssr.md

### HIGH Ambiguous Lit fallback client

Wrong:

```ts
import { QueryController } from '@tanstack/lit-query'

export class TodoElement extends HTMLElement {
  todos = new QueryController(this, {
    queryKey: ['todos'],
    queryFn: async () => [],
  })
}
```

Correct:

```ts
import { QueryClient } from '@tanstack/query-core'
import { QueryController } from '@tanstack/lit-query'

const queryClient = new QueryClient()

export class TodoElement extends HTMLElement {
  todos = new QueryController(
    this,
    { queryKey: ['todos'], queryFn: async () => [] },
    queryClient,
  )
}
```

Lit controllers need a clear provider or explicit client when the element is not under a provider tree.

Source: TanStack/query:docs/framework/lit/guides/reactive-controllers-vs-hooks.md

See also: `lifecycle/ssr-hydration-and-streaming` for server cache handoff.
