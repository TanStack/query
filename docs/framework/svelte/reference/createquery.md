---
id: createQuery
title: createQuery
---

# Function: createQuery()

## createQuery(options, queryClient)

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(
  options,
  queryClient?,
): CreateQueryResult<TData, TError>
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **options**: [`StoreOrVal`](storeorval.md)\<[`UndefinedInitialDataOptions`](undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

• **queryClient?**: `QueryClient`

### Returns

[`CreateQueryResult`](createqueryresult.md)\<`TData`, `TError`\>

### Defined in

[packages/svelte-query/src/createQuery.ts:15](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/createQuery.ts#L15)

## createQuery(options, queryClient)

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(
  options,
  queryClient?,
): DefinedCreateQueryResult<TData, TError>
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **options**: [`StoreOrVal`](storeorval.md)\<[`DefinedInitialDataOptions`](definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

• **queryClient?**: `QueryClient`

### Returns

[`DefinedCreateQueryResult`](definedcreatequeryresult.md)\<`TData`, `TError`\>

### Defined in

[packages/svelte-query/src/createQuery.ts:27](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/createQuery.ts#L27)
