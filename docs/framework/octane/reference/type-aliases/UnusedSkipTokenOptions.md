---
id: UnusedSkipTokenOptions
title: UnusedSkipTokenOptions
---

# Type Alias: UnusedSkipTokenOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> = OmitKeyof<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object;
```

Defined in: packages/octane-query/src/queryOptions.ts:26

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>["queryFn"], SkipToken | undefined>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`
