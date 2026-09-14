---
id: useIsFetching
title: useIsFetching
redirect_from:
  - framework/solid/reference/useIsFetching
---

```ts
function useIsFetching(filters?, queryClient?): Accessor<number>;
```

Defined in: [packages/solid-query/src/useIsFetching.ts:29](https://github.com/TanStack/query/blob/main/packages/solid-query/src/useIsFetching.ts#L29)

The `useIsFetching` hook returns the `number` of the queries that your application is loading or fetching
in the background (useful for app-wide loading indicators).

## Parameters

### filters?

`Accessor`\<[`QueryFilters`](../interfaces/QueryFilters.md)\<readonly `unknown`[]\>\>

An accessor returning the [QueryFilters](../interfaces/QueryFilters.md) to narrow down the matched queries.

### queryClient?

`Accessor`\<[`QueryClient`](../classes/QueryClient.md)\>

An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
will be used.

## Returns

`Accessor`\<`number`\>

An accessor for the `number` of the queries that your application is currently loading or fetching
in the background.

## Example

```tsx
import { useIsFetching } from '@tanstack/solid-query'

function GlobalLoadingIndicator() {
  // How many queries matching the posts prefix are fetching?
  const isFetchingPosts = useIsFetching(() => ({ queryKey: ['posts'] }))

  return isFetchingPosts() > 0 ? <span>Loading posts...</span> : null
}
```
