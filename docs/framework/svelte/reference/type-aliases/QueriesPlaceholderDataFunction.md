---
id: QueriesPlaceholderDataFunction
title: QueriesPlaceholderDataFunction
---

```ts
type QueriesPlaceholderDataFunction<TQueryData> = (previousData: undefined, previousQuery: undefined) => TQueryData | undefined;
```

Defined in: [packages/query-core/src/types.ts:283](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L283)

The `placeholderData` function of a query in `useQueries` and its counterparts. Unlike
[PlaceholderDataFunction](PlaceholderDataFunction.md), it receives no previous data or query, because the number of
queries can differ between renders.

## Type Parameters

### TQueryData

`TQueryData`

## Parameters

### previousData

`undefined`

### previousQuery

`undefined`

## Returns

`TQueryData` \| `undefined`
