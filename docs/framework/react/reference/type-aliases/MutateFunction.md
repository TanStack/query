---
id: MutateFunction
title: MutateFunction
---

```ts
type MutateFunction<TData, TError, TVariables, TOnMutateResult> = (...rest: MutateFunctionRest<TData, TError, TVariables, TOnMutateResult>) => Promise<TData>;
```

Defined in: [packages/query-core/src/types.ts:1394](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1394)

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
