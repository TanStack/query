---
id: queryOptions
title: queryOptions
---

# Function: queryOptions()

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`DefinedInitialDataOptions`](../type-aliases/definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`DefinedInitialDataOptions`](../type-aliases/definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

### Defined in

[packages/svelte-query/src/queryOptions.ts:31](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L31)

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

### Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`UndefinedInitialDataOptions`](../type-aliases/undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`UndefinedInitialDataOptions`](../type-aliases/undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

### Defined in

[packages/svelte-query/src/queryOptions.ts:42](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L42)
