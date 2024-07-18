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

[packages/svelte-query/src/createQuery.ts:15](https://github.com/TanStack/query/blob/81ca3332486f7b98502d4f5ea50588d88a80f59b/packages/svelte-query/src/createQuery.ts#L15)

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

[packages/svelte-query/src/createQuery.ts:27](https://github.com/TanStack/query/blob/81ca3332486f7b98502d4f5ea50588d88a80f59b/packages/svelte-query/src/createQuery.ts#L27)
