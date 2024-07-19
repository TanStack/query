---
id: createQuery
title: createQuery
---

# Function: createQuery()

## createQuery(options, queryClient)

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): CreateQueryResult<TData, TError>
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

### Parameters

• **options**: [`StoreOrVal`](StoreOrVal.md)\<[`UndefinedInitialDataOptions`](UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

• **queryClient?**: `QueryClient`

### Returns

[`CreateQueryResult`](CreateQueryResult.md)\<`TData`, `TError`\>

### Defined in

[packages/svelte-query/src/createQuery.ts:15](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/createQuery.ts#L15)

## createQuery(options, queryClient)

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): DefinedCreateQueryResult<TData, TError>
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

### Parameters

• **options**: [`StoreOrVal`](StoreOrVal.md)\<[`DefinedInitialDataOptions`](DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

• **queryClient?**: `QueryClient`

### Returns

[`DefinedCreateQueryResult`](DefinedCreateQueryResult.md)\<`TData`, `TError`\>

### Defined in

[packages/svelte-query/src/createQuery.ts:27](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/createQuery.ts#L27)
