---
id: PlaceholderDataFunction
title: PlaceholderDataFunction
---

```ts
type PlaceholderDataFunction<TQueryFnData, TError, TQueryData, TQueryKey> = (previousData: TQueryData | undefined, previousQuery:
  | Query<TQueryFnData, TError, TQueryData, TQueryKey>
  | undefined) => TQueryData | undefined;
```

Defined in: [packages/query-core/src/types.ts:184](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L184)

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
