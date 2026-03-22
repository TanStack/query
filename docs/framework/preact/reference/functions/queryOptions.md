---
id: queryOptions
title: queryOptions
---

# Function: queryOptions()

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & object;
```

Defined in: [preact-query/src/queryOptions.ts:52](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/queryOptions.ts#L52)

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

[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

`Omit`\<[`UseQueryOptions`](../interfaces/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"`\> & `object` & `object`

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): OmitKeyof<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & object;
```

Defined in: [preact-query/src/queryOptions.ts:63](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/queryOptions.ts#L63)

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

[`UnusedSkipTokenOptions`](../type-aliases/UnusedSkipTokenOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

`OmitKeyof`\<[`UseQueryOptions`](../interfaces/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"`\> & `object` & `object`

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & object;
```

Defined in: [preact-query/src/queryOptions.ts:74](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/queryOptions.ts#L74)

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

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

### Returns

[`UseQueryOptions`](../interfaces/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & `object`
