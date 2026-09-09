---
id: setQueryClientContext
title: setQueryClientContext
---

```ts
function setQueryClientContext(client): void;
```

Defined in: [packages/svelte-query/src/context.ts:45](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/context.ts#L45)

Sets a `QueryClient` on Svelte's context, so it can be read with [getQueryClientContext](getQueryClientContext.md) (or
[useQueryClient](useQueryClient.md)) from any descendant component. `QueryClientProvider` wraps this — use it directly
only if you need to set the client from your own component instead.

## Parameters

### client

[`QueryClient`](../classes/QueryClient.md)

The `QueryClient` to make available to descendant components.

## Returns

`void`

## Example

```svelte
<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  ...
</QueryClientProvider>
```
