---
id: queryOptions
title: queryOptions
---

# Function: queryOptions()

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & object;
```

Defined in: [packages/svelte-query/src/queryOptions.ts:30](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L30)

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`DefinedInitialDataOptions`](../../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`CreateQueryOptions`](../../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & `object`

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & object;
```

Defined in: [packages/svelte-query/src/queryOptions.ts:41](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L41)

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`UndefinedInitialDataOptions`](../../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`CreateQueryOptions`](../../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & `object`
