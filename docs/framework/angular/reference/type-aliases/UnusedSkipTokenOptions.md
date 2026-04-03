---
id: UnusedSkipTokenOptions
title: UnusedSkipTokenOptions
---

# Type Alias: UnusedSkipTokenOptions\<TQueryFnData, TError, TData, TQueryKey\>

```ts
type UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> = OmitKeyof<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object;
```

Defined in: [query-options.ts:25](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L25)

## Type Declaration

### queryFn?

```ts
optional queryFn: Exclude<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>["queryFn"], SkipToken | undefined>;
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
