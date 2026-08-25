---
id: DefinedInitialDataInfiniteOptions
title: DefinedInitialDataInfiniteOptions
---

```ts
type DefinedInitialDataInfiniteOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> = UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:68](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L68)

## Type Declaration

### initialData

```ts
initialData: 
  | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
  | () => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
  | undefined;
```

If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
created or cached yet). If set to a function, the function will be called **once** during the shared/root
query initialization, and be expected to synchronously return the initial data. Initial data is
considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
cache.

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError` = `DefaultError`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`\>

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`
