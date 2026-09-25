---
id: UseMutateFunction
title: UseMutateFunction
---

```ts
type UseMutateFunction<TData, TError, TVariables, TOnMutateResult> = (...args: Parameters<MutateFunction<TData, TError, TVariables, TOnMutateResult>>) => void;
```

Defined in: [packages/solid-query/src/types.ts:280](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L280)

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
