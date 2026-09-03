---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

Allows sharing and re-using infinite query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

## Param

The infinite query options to tag with the type from `queryFn`.

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [infinite-query-options.ts:87](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L87)

Allows sharing and re-using infinite query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

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

The infinite query options to tag with the type from `queryFn`.

### Returns

[`CreateInfiniteQueryOptions`](../interfaces/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `InfiniteData`\<`TQueryFnData`, `unknown`\>, `TError`\>

The tagged infinite query options.

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): OmitKeyof<CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [infinite-query-options.ts:117](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L117)

Allows sharing and re-using infinite query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

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

The infinite query options to tag with the type from `queryFn`.

### Returns

`OmitKeyof`\<[`CreateInfiniteQueryOptions`](../interfaces/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"queryFn"`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `InfiniteData`\<`TQueryFnData`, `unknown`\>, `TError`\>

The tagged infinite query options.

## Call Signature

```ts
function infiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options): CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & object & QueryKeyWithDataTag<TQueryKey, InfiniteData<TQueryFnData, unknown>, TError>;
```

Defined in: [infinite-query-options.ts:147](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L147)

Allows sharing and re-using infinite query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

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

The infinite query options to tag with the type from `queryFn`.

### Returns

[`CreateInfiniteQueryOptions`](../interfaces/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `InfiniteData`\<`TQueryFnData`, `unknown`\>, `TError`\>

The tagged infinite query options.
