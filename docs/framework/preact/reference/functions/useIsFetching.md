---
id: useIsFetching
title: useIsFetching
---

```ts
function useIsFetching(filters?: QueryFilters<readonly unknown[]>, queryClient?: QueryClient): number;
```

Defined in: [packages/preact-query/src/useIsFetching.ts:41](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useIsFetching.ts#L41)

The `useIsFetching` hook returns the `number` of the queries that your application is loading or fetching in
the background (useful for app-wide loading indicators).

## Parameters

### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

The [QueryFilters](../interfaces/QueryFilters.md) to narrow down the matched queries.

<a id="filters-properties"></a>

#### `filters` properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="filters-property-exact"></a> `exact?` | `boolean` | `undefined` | Match query key exactly |
| <a id="filters-property-fetchstatus"></a> `fetchStatus?` | `"fetching"` \| `"paused"` \| `"idle"` | `undefined` | Include queries matching their fetchStatus |
| <a id="filters-property-predicate"></a> `predicate?` | (`query`: [`Query`](../classes/Query.md)) => `boolean` | `undefined` | Include queries matching this predicate function |
| <a id="filters-property-querykey"></a> `queryKey?` | `TQueryKey` \| `TuplePrefixes`\<`TQueryKey`\> | `undefined` | Include queries matching this query key |
| <a id="filters-property-stale"></a> `stale?` | `boolean` | `undefined` | Include or exclude stale queries |
| <a id="filters-property-type"></a> `type?` | `QueryTypeFilter` | `'all'` | Filter to active queries, inactive queries or all queries |

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
be used.

## Returns

`number`

Will be the `number` of the queries that your application is currently loading or fetching in the
background.

## Examples

```tsx
import { useIsFetching } from '@tanstack/preact-query'

function PostsFetchingIndicator() {
  // How many queries matching the posts prefix are fetching?
  const isFetchingPosts = useIsFetching({ queryKey: ['posts'] })

  return isFetchingPosts ? <span>Refreshing posts...</span> : null
}
```

A global loading indicator for any query fetching in the background, not just the ones on screen:
```tsx
import { useIsFetching } from '@tanstack/preact-query'

function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()

  return isFetching ? (
    <div>Queries are fetching in the background...</div>
  ) : null
}
```
