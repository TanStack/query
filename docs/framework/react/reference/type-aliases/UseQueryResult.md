---
id: UseQueryResult
title: UseQueryResult
---

```ts
type UseQueryResult<TData, TError> = UseBaseQueryResult<TData, TError>;
```

Defined in: [packages/react-query/src/types.ts:325](https://github.com/TanStack/query/blob/main/packages/react-query/src/types.ts#L325)

The result of `useQuery`. Same as [UseBaseQueryResult](UseBaseQueryResult.md).

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
