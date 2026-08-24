---
id: useIsFetching
title: useIsFetching
---

```ts
function useIsFetching(filters?, queryClient?): number;
```

Defined in: [preact-query/src/useIsFetching.ts:28](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useIsFetching.ts#L28)

`useIsFetching` is an optional hook that returns the `number` of the queries that your application is loading or
fetching in the background (useful for app-wide loading indicators).

## Parameters

### filters?

`QueryFilters`\<readonly `unknown`[]\>

The QueryFilters to narrow down the matched queries.

### queryClient?

`QueryClient`

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

## Returns

`number`

Will be the `number` of the queries that your application is currently loading or fetching in the
background.

## Example

```tsx
import { useIsFetching } from '@tanstack/preact-query'

// How many queries are fetching?
const isFetching = useIsFetching()
// How many queries matching the posts prefix are fetching?
const isFetchingPosts = useIsFetching({ queryKey: ['posts'] })
```
