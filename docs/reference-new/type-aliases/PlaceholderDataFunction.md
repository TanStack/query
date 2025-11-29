---
id: PlaceholderDataFunction
title: PlaceholderDataFunction
---

# Type Alias: PlaceholderDataFunction()\<TQueryFnData, TError, TQueryData, TQueryKey\>

```ts
type PlaceholderDataFunction<TQueryFnData, TError, TQueryData, TQueryKey> = (previousData, previousQuery) => TQueryData | undefined;
```

Defined in: [packages/query-core/src/types.ts:171](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L171)

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TQueryData

`TQueryData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

## Parameters

### previousData

`TQueryData` | `undefined`

### previousQuery

[`Query`](../classes/Query.md)\<`TQueryFnData`, `TError`, `TQueryData`, `TQueryKey`\> | `undefined`

## Returns

`TQueryData` \| `undefined`
