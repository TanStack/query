---
id: MutateFunction
title: MutateFunction
---

# Type Alias: MutateFunction()\<TData, TError, TVariables, TOnMutateResult\>

```ts
type MutateFunction<TData, TError, TVariables, TOnMutateResult> = (variables, options?) => Promise<TData>;
```

Defined in: [packages/query-core/src/types.ts:1181](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1181)

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

### variables

`TVariables`

### options?

[`MutateOptions`](../interfaces/MutateOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Returns

`Promise`\<`TData`\>
