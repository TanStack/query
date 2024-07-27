---
id: queryOptions
title: queryOptions
---

# Function: queryOptions()

## queryOptions(options)

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **options**: [`DefinedInitialDataOptions`](../type-aliases/definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`DefinedInitialDataOptions`](../type-aliases/definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

### Defined in

[packages/svelte-query/src/queryOptions.ts:26](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/queryOptions.ts#L26)

## queryOptions(options)

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **options**: [`UndefinedInitialDataOptions`](../type-aliases/undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`UndefinedInitialDataOptions`](../type-aliases/undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

### Defined in

[packages/svelte-query/src/queryOptions.ts:37](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/svelte-query/src/queryOptions.ts#L37)
