---
id: useIsFetching
title: useIsFetching
---

```ts
function useIsFetching(filters?, queryClient?): ReactiveValue<number>;
```

Defined in: [packages/svelte-query/src/useIsFetching.svelte.ts:40](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useIsFetching.svelte.ts#L40)

## Parameters

### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

[QueryFilters](../interfaces/QueryFilters.md) to narrow down which queries to count. Omit to count every fetching
query.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`ReactiveValue`\<`number`\>

A reactive value — read `.current` to get how many matching queries are currently fetching.

## Examples

```svelte
<script lang="ts">
  import { useIsFetching } from '@tanstack/svelte-query'

  // How many queries matching the posts prefix are fetching?
  const isFetchingPosts = useIsFetching({ queryKey: ['posts'] })
</script>

{#if isFetchingPosts.current}
  <span>Refreshing posts...</span>
{/if}
```

A global loading indicator for any query fetching in the background, not just the ones on screen:
```svelte
<script lang="ts">
  import { useIsFetching } from '@tanstack/svelte-query'

  const isFetching = useIsFetching()
</script>

{#if isFetching.current}
  <div>Queries are fetching in the background...</div>
{/if}
```
