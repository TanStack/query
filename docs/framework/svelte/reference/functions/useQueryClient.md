---
id: useQueryClient
title: useQueryClient
---

```ts
function useQueryClient(queryClient?: QueryClient): QueryClient;
```

Defined in: [packages/svelte-query/src/useQueryClient.ts:24](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useQueryClient.ts#L24)

The `useQueryClient` function returns the current `QueryClient` instance.

## Parameters

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

[`QueryClient`](../classes/QueryClient.md)

The current `QueryClient` instance.

## Throws

If no `queryClient` argument is passed and no `QueryClientProvider` is found in the component tree.

## Example

```svelte
<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query'

  const queryClient = useQueryClient()

  function refreshPosts() {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }
</script>
```
