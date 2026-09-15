---
id: UseMutateFunction
title: UseMutateFunction
---

```ts
type UseMutateFunction<TData, TError, TVariables, TOnMutateResult> = (...args) => void;
```

Defined in: [packages/preact-query/src/types.ts:432](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L432)

The type of `mutate`, as returned by `useMutation`. Forwards the variables (and an optional per-call
`onSuccess`/`onError`/`onSettled`) to the underlying `mutate` call. Fire-and-forget — errors are surfaced
through the mutation result, not thrown.

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
