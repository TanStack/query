---
id: useIsFetching
title: useIsFetching
---

```ts
function useIsFetching(filters?: QueryFilters<readonly unknown[]>, queryClient?: QueryClient): ReactiveValue<number>;
```

Defined in: [packages/svelte-query/src/useIsFetching.svelte.ts:40](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/useIsFetching.svelte.ts#L40)

The `useIsFetching` function returns the `number` of the queries that your application is loading or
fetching in the background (useful for app-wide loading indicators).

## Parameters

### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

[QueryFilters](../interfaces/QueryFilters.md) to narrow down which queries to count. Omit to count every fetching
query.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="filters-exact"></a> `exact?` | `boolean` | `undefined` | Match query key exactly |
| <a id="filters-fetchstatus"></a> `fetchStatus?` | `"fetching"` \| `"paused"` \| `"idle"` | `undefined` | Include queries matching their fetchStatus |
| <a id="filters-predicate"></a> `predicate?` | (`query`: [`Query`](../classes/Query.md)) => `boolean` | `undefined` | Include queries matching this predicate function |
| <a id="filters-querykey"></a> `queryKey?` | `TQueryKey` \| `TuplePrefixes`\<`TQueryKey`\> | `undefined` | Include queries matching this query key |
| <a id="filters-stale"></a> `stale?` | `boolean` | `undefined` | Include or exclude stale queries |
| <a id="filters-type"></a> `type?` | `QueryTypeFilter` | `'all'` | Filter to active queries, inactive queries or all queries |

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
