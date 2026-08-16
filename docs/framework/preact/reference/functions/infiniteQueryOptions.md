---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

# Function: infiniteQueryOptions()

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & object;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:76](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L76)

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

### Returns

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & `object`

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): OmitKeyof<UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object & object;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:100](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L100)

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UnusedSkipTokenInfiniteOptions`](../type-aliases/UnusedSkipTokenInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

### Returns

`OmitKeyof`\<[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"queryFn"`\> & `object` & `object`

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & object;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:124](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L124)

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

#### TPageParam

`TPageParam` = `unknown`

### Parameters

#### options

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

### Returns

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & `object`
