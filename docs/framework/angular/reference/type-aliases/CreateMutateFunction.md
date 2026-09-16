---
id: CreateMutateFunction
title: CreateMutateFunction
---

```ts
type CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> = (...args) => void;
```

Defined in: [packages/angular-query/src/types.ts:251](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L251)

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `void`

The type of the variable passed to `mutate`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.

## Parameters

### args

...`Parameters`\<[`MutateFunction`](MutateFunction.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>\>

## Returns

`void`
