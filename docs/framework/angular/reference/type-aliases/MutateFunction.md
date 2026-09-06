---
id: MutateFunction
title: MutateFunction
---

```ts
type MutateFunction<TData, TError, TVariables, TOnMutateResult> = (...rest) => Promise<TData>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:743

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

### rest

...[`MutateFunctionRest`](MutateFunctionRest.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Returns

`Promise`\<`TData`\>
