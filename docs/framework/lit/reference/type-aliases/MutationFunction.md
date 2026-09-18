---
id: MutationFunction
title: MutationFunction
---

```ts
type MutationFunction<TData, TVariables> = (variables: TVariables, context: MutationFunctionContext) => Promise<TData>;
```

Defined in: [packages/query-core/src/types.ts:1213](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1213)

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
