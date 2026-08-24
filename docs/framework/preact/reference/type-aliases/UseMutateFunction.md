---
id: UseMutateFunction
title: UseMutateFunction
---

```ts
type UseMutateFunction<TData, TError, TVariables, TOnMutateResult> = (...args) => void;
```

Defined in: [preact-query/src/types.ts:259](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L259)

The type of `mutate`, as returned by `useMutation`. Forwards the variables (and an optional per-call
`onSuccess`/`onError`/`onSettled`) to the underlying `mutate` call. Fire-and-forget — errors are surfaced
through the mutation result, not thrown.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Parameters

### args

...`Parameters`\<`MutateFunction`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>\>

## Returns

`void`
