---
id: CreateMutateFunction
title: CreateMutateFunction
---

```ts
type CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> = (...args: Parameters<MutateFunction<TData, TError, TVariables, TOnMutateResult>>) => void;
```

Defined in: [packages/svelte-query/src/types.ts:112](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L112)

The type of `mutate`, as returned by `createMutation`. Forwards the variables (and an optional per-call
`onSuccess`/`onError`/`onSettled`) to the underlying `mutate` call. Fire-and-forget — errors are surfaced
through the mutation result, not thrown.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Parameters

### args

...`Parameters`\<[`MutateFunction`](MutateFunction.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>\>

## Returns

`void`
