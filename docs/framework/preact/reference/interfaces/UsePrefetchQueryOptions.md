---
id: UsePrefetchQueryOptions
title: UsePrefetchQueryOptions
---

# Interface: UsePrefetchQueryOptions\<TQueryFnData, TError, TData, TQueryKey\>

Defined in: [preact-query/src/types.ts:49](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/types.ts#L49)

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

Defined in: [preact-query/src/types.ts:58](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/types.ts#L58)
