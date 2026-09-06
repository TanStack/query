---
id: QueryKeyWithDataTag
title: QueryKeyWithDataTag
---

```ts
type QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError> = object;
```

Defined in: [packages/query-core/src/types.ts:82](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L82)

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

Defined in: [packages/query-core/src/types.ts:87](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L87)
