---
id: MutationFunction
title: MutationFunction
---

```ts
type MutationFunction<TData, TVariables> = (variables, context) => Promise<TData>;
```

Defined in: [packages/query-core/src/types.ts:1195](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1195)

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
