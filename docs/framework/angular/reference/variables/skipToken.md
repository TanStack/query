---
id: skipToken
title: skipToken
---

```ts
const skipToken: unique symbol;
```

Defined in: packages/query-core/dist-ts/src/utils.d.ts:180

Sentinel value that can be passed as a query's `queryFn` to conditionally disable the query (equivalent
to `enabled: false`) while preserving full type inference for the query's data. Unlike `enabled: false`,
a query disabled via `skipToken` cannot be triggered with `refetch`.

## Example

```ts
new QueryObserver(queryClient, {
  queryKey: ['post', postId],
  queryFn: postId != null ? () => fetchPost(postId) : skipToken,
})
```
