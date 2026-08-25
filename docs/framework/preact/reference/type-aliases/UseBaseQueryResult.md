---
id: UseBaseQueryResult
title: UseBaseQueryResult
---

```ts
type UseBaseQueryResult<TData, TError> = QueryObserverResult<TData, TError>;
```

Defined in: [preact-query/src/types.ts:257](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L257)

The result of `useQuery` and `useInfiniteQuery` when `initialData` isn't set — `data` may be `undefined`
while the query is `pending`. Re-exports QueryObserverResult from `@tanstack/query-core`.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`
