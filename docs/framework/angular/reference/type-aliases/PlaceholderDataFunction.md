---
id: PlaceholderDataFunction
title: PlaceholderDataFunction
---

```ts
type PlaceholderDataFunction<TQueryFnData, TError, TQueryData, TQueryKey> = (previousData, previousQuery) => TQueryData | undefined;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:72

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
