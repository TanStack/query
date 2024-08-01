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
): DefinedCreateQueryResult<TData, TError>
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **options**: [`StoreOrVal`](../type-aliases/storeorval.md)\<[`DefinedInitialDataOptions`](../type-aliases/definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

• **queryClient?**: `QueryClient`

### Returns

[`DefinedCreateQueryResult`](../type-aliases/definedcreatequeryresult.md)\<`TData`, `TError`\>

### Defined in

[packages/svelte-query/src/createQuery.ts:15](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/createQuery.ts#L15)

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

• **options**: [`StoreOrVal`](../type-aliases/storeorval.md)\<[`UndefinedInitialDataOptions`](../type-aliases/undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

• **queryClient?**: `QueryClient`

### Returns

[`CreateQueryResult`](../type-aliases/createqueryresult.md)\<`TData`, `TError`\>

### Defined in

[packages/svelte-query/src/createQuery.ts:27](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/createQuery.ts#L27)

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

• **options**: [`StoreOrVal`](../type-aliases/storeorval.md)\<[`CreateQueryOptions`](../type-aliases/createqueryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

• **queryClient?**: `QueryClient`

### Returns

[`CreateQueryResult`](../type-aliases/createqueryresult.md)\<`TData`, `TError`\>

### Defined in

[packages/svelte-query/src/createQuery.ts:39](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/createQuery.ts#L39)
