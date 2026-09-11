---
id: skipToken
title: skipToken
---

```ts
const skipToken: typeof skipToken;
```

Defined in: [packages/query-core/src/utils.ts:522](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L522)

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
