---
id: keepPreviousData
title: keepPreviousData
---

```ts
function keepPreviousData<T>(previousData): T | undefined;
```

Defined in: [packages/query-core/src/utils.ts:493](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L493)

Intended to be passed as a query's `placeholderData` option, for example
`placeholderData: keepPreviousData`. Instead of resetting the query's data to `undefined` while a new
query key is fetching, it keeps displaying the previously fetched data until the new data arrives.

## Type Parameters

### T

`T`

## Parameters

### previousData

`T` | `undefined`

## Returns

`T` \| `undefined`

## Example

```ts
new QueryObserver(queryClient, {
  queryKey: ['posts', page],
  queryFn: () => fetchPosts(page),
  placeholderData: keepPreviousData,
})
```
