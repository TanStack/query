---
id: CreateMutateFunction
title: CreateMutateFunction
---

```ts
type CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> = (...args) => void;
```

Defined in: [packages/svelte-query/src/types.ts:103](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L103)

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
