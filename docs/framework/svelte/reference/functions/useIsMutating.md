---
id: useIsMutating
title: useIsMutating
---

```ts
function useIsMutating(filters?: MutationFilters<unknown, Error, unknown, unknown>, queryClient?: QueryClient): ReactiveValue<number>;
```

Defined in: [packages/svelte-query/src/useIsMutating.svelte.ts:26](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useIsMutating.svelte.ts#L26)

`useIsMutating` is an optional function that returns the `number` of mutations that your application is
running (useful for app-wide loading indicators).

## Parameters

### filters?

[`MutationFilters`](../interfaces/MutationFilters.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

[MutationFilters](../interfaces/MutationFilters.md) to narrow down which mutations to count.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filters-exact"></a> `exact?` | `boolean` | Match mutation key exactly |
| <a id="filters-mutationkey"></a> `mutationKey?` | readonly `unknown`[] | Include mutations matching this mutation key |
| <a id="filters-predicate"></a> `predicate?` | (`mutation`: [`Mutation`](../classes/Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `boolean` | Include mutations matching this predicate function |
| <a id="filters-status"></a> `status?` | `"error"` \| `"pending"` \| `"success"` \| `"idle"` | Filter by mutation status |

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
