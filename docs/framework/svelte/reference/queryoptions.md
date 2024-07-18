---
id: queryOptions
title: queryOptions
---

# Function: queryOptions()

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

• **options**: [`UndefinedInitialDataOptions`](undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`UndefinedInitialDataOptions`](undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

### Defined in

[packages/svelte-query/src/queryOptions.ts:26](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/queryOptions.ts#L26)

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

• **options**: [`DefinedInitialDataOptions`](definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`DefinedInitialDataOptions`](definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

### Defined in

[packages/svelte-query/src/queryOptions.ts:37](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/queryOptions.ts#L37)
