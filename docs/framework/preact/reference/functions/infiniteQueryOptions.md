---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:81](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L81)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

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

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `InfiniteData`\<`TQueryFnData`, `unknown`\>, `TError`\>

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): OmitKeyof<UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:109](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L109)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

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

`OmitKeyof`\<[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"queryFn"`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `InfiniteData`\<`TQueryFnData`, `unknown`\>, `TError`\>

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [preact-query/src/infiniteQueryOptions.ts:137](https://github.com/TanStack/query/blob/main/packages/preact-query/src/infiniteQueryOptions.ts#L137)

You can generally pass everything to `infiniteQueryOptions` that you can also pass to `useInfiniteQuery`.
These options can be shared across hooks and imperative APIs such as `queryClient.infiniteQuery`.
`options.queryKey` is required and is the query key to generate options for.

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

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `InfiniteData`\<`TQueryFnData`, `unknown`\>, `TError`\>
