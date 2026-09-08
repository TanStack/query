---
id: useIsMutating
title: useIsMutating
---

```ts
function useIsMutating(filters?, queryClient?): ReactiveValue<number>;
```

Defined in: [packages/svelte-query/src/useIsMutating.svelte.ts:28](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useIsMutating.svelte.ts#L28)

`useIsMutating` is an optional hook that returns the `number` of mutations that your application is
running (useful for app-wide loading indicators).

## Parameters

### filters?

[`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

[MutationFilters](../interfaces/MutationFilters.md) to narrow down which mutations to count.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`ReactiveValue`\<`number`\>

A reactive value — read `.current` to get how many matching mutations are currently running.

## Example

```svelte
<script lang="ts">
  import { useIsMutating } from '@tanstack/svelte-query'

  // How many mutations matching the posts prefix are in progress?
  const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
</script>

{#if isMutatingPosts.current}
  <span>Saving posts...</span>
{/if}
```
