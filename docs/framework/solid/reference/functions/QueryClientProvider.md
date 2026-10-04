---
id: QueryClientProvider
title: QueryClientProvider
---

```ts
function QueryClientProvider(props: QueryClientProviderProps): Element;
```

Defined in: [packages/solid-query/src/QueryClientProvider.tsx:100](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClientProvider.tsx#L100)

Use the `QueryClientProvider` component to connect and provide a `QueryClient` to your application. Also
calls `client.mount()`/`client.unmount()` as this component mounts/unmounts, which subscribes the client to
focus/online events (resuming any paused mutations and refetching as needed when the app regains focus or
comes back online).

## Parameters

### props

[`QueryClientProviderProps`](../type-aliases/QueryClientProviderProps.md)

The `client` to provide, and the `children` that get access to it.

## Returns

`Element`

The provided `children`, wrapped so they can read the `QueryClient` via `useQueryClient`.

## Example

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'

const queryClient = new QueryClient()

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```
