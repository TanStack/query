---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

Defined in: [preact-query/src/types.ts:48](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L48)

## Extends

- `OmitKeyof`\<`FetchQueryOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

## Properties

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey, never>;
```

Defined in: [preact-query/src/types.ts:57](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L57)
