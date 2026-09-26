---
id: UseQueryResult
title: UseQueryResult
---

```ts
type UseQueryResult<TData, TError> = UseBaseQueryResult<TData, TError>;
```

Defined in: [packages/preact-query/src/types.ts:324](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L324)

The result of `useQuery`. Same as [UseBaseQueryResult](UseBaseQueryResult.md).

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
