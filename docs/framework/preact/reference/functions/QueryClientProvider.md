---
id: QueryClientProvider
title: QueryClientProvider
---

```ts
function QueryClientProvider(__namedParameters): VNode;
```

Defined in: [preact-query/src/QueryClientProvider.tsx:63](https://github.com/TanStack/query/blob/main/packages/preact-query/src/QueryClientProvider.tsx#L63)

Use the `QueryClientProvider` component to connect and provide a `QueryClient` to your application.

## Parameters

### \_\_namedParameters

[`QueryClientProviderProps`](../type-aliases/QueryClientProviderProps.md)

## Returns

`VNode`

The provided `children`, wrapped so they can read the `QueryClient` via `useQueryClient`.

## Example

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'

const queryClient = new QueryClient()

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```
