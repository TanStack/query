---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [packages/svelte-query/src/infiniteQueryOptions.ts:50](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/infiniteQueryOptions.ts#L50)

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

[`CreateInfiniteQueryOptions`](../type-aliases/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `InfiniteData`\<`TQueryFnData`, `unknown`\>, `TError`\>

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [packages/svelte-query/src/infiniteQueryOptions.ts:73](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/infiniteQueryOptions.ts#L73)

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

[`CreateInfiniteQueryOptions`](../type-aliases/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `InfiniteData`\<`TQueryFnData`, `unknown`\>, `TError`\>
