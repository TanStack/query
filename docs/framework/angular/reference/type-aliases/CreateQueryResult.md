---
id: CreateQueryResult
title: CreateQueryResult
---

```ts
type CreateQueryResult<TData, TError> = CreateBaseQueryResult<TData, TError>;
```

Defined in: [packages/angular-query/src/types.ts:204](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L204)

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
