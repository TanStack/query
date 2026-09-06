---
id: useIsFetching
title: useIsFetching
---

```ts
function useIsFetching(filters?, queryClient?): number;
```

Defined in: [packages/preact-query/src/useIsFetching.ts:44](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useIsFetching.ts#L44)

The `useIsFetching` hook returns the `number` of the queries that your application is loading or fetching in
the background (useful for app-wide loading indicators).

## Parameters

### filters?

[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>

The [QueryFilters](../interfaces/QueryFilters.md) to narrow down the matched queries.

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
