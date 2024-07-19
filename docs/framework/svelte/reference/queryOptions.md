---
id: queryOptions
title: queryOptions
---

# Function: queryOptions()

## queryOptions(options)

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

### Parameters

• **options**: [`UndefinedInitialDataOptions`](UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`UndefinedInitialDataOptions`](UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

### Defined in

[packages/svelte-query/src/queryOptions.ts:26](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/queryOptions.ts#L26)

## queryOptions(options)

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** *extends* `QueryKey` = `QueryKey`

### Parameters

• **options**: [`DefinedInitialDataOptions`](DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`DefinedInitialDataOptions`](DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

### Defined in

[packages/svelte-query/src/queryOptions.ts:37](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/svelte-query/src/queryOptions.ts#L37)
