---
id: CreateMutateAsyncFunction
title: CreateMutateAsyncFunction
---

```ts
type CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> = MutateFunction<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [types.ts:266](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L266)

The type of `mutateAsync`, as returned by `injectMutation`. Similar to [CreateMutateFunction](CreateMutateFunction.md), but
returns a promise which can be awaited.

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = `DefaultError`

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `void`

The type of the variable passed to `mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.
