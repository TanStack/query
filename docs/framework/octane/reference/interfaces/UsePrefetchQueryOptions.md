---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

# Interface: UsePrefetchQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

Defined in: packages/octane-query/src/types.ts:54

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

Defined in: packages/octane-query/src/types.ts:63
