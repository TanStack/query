---
id: UseMutateAsyncFunction
title: UseMutateAsyncFunction
---

```ts
type UseMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> = MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [preact-query/src/types.ts:274](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L274)

The type of `mutateAsync`, as returned by `useMutation`. Similar to [UseMutateFunction](UseMutateFunction.md), but returns a
promise which can be awaited.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
