---
id: CreateQueryResult
title: CreateQueryResult
---

```ts
type CreateQueryResult<TData, TError> = CreateBaseQueryResult<TData, TError>;
```

Defined in: [packages/angular-query-experimental/src/types.ts:156](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L156)

The result of `injectQuery`. Same as [CreateBaseQueryResult](CreateBaseQueryResult.md).

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.
