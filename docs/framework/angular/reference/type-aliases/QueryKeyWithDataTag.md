---
id: QueryKeyWithDataTag
title: QueryKeyWithDataTag
---

```ts
type QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> = object;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:37

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

## Properties

### queryKey

```ts
queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:38
