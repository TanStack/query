---
id: MutationFunction
title: MutationFunction
---

```ts
type MutationFunction<TData, TVariables> = (variables, context) => Promise<TData>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:724

## Type Parameters

### TData

`TData` = `unknown`

### TVariables

`TVariables` = `unknown`

## Parameters

### variables

`TVariables`

### context

[`MutationFunctionContext`](MutationFunctionContext.md)

## Returns

`Promise`\<`TData`\>
