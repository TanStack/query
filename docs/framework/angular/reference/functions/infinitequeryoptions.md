---
id: infiniteQueryOptions
title: infiniteQueryOptions
---

# Function: infiniteQueryOptions()

Allows to share and re-use infinite query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

## Param

The infinite query options to tag with the type from `queryFn`.

## Call Signature

```ts
function infiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(
  options,
): DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  object
```

Allows to share and re-use infinite query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

• **TPageParam** = `unknown`

### Parameters

#### options

[`DefinedInitialDataInfiniteOptions`](../../type-aliases/definedinitialdatainfiniteoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The infinite query options to tag with the type from `queryFn`.

### Returns

[`DefinedInitialDataInfiniteOptions`](../../type-aliases/definedinitialdatainfiniteoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object`

The tagged infinite query options.

The tagged infinite query options.

### Param

The infinite query options to tag with the type from `queryFn`.

### Defined in

[infinite-query-options.ts:94](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L94)

## Call Signature

```ts
function infiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(
  options,
): UnusedSkipTokenInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  object
```

Allows to share and re-use infinite query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

• **TPageParam** = `unknown`

### Parameters

#### options

[`UnusedSkipTokenInfiniteOptions`](../../type-aliases/unusedskiptokeninfiniteoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The infinite query options to tag with the type from `queryFn`.

### Returns

[`UnusedSkipTokenInfiniteOptions`](../../type-aliases/unusedskiptokeninfiniteoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object`

The tagged infinite query options.

The tagged infinite query options.

### Param

The infinite query options to tag with the type from `queryFn`.

### Defined in

[infinite-query-options.ts:126](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L126)

## Call Signature

```ts
function infiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(
  options,
): UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> &
  object
```

Allows to share and re-use infinite query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

• **TPageParam** = `unknown`

### Parameters

#### options

[`UndefinedInitialDataInfiniteOptions`](../../type-aliases/undefinedinitialdatainfiniteoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

The infinite query options to tag with the type from `queryFn`.

### Returns

[`UndefinedInitialDataInfiniteOptions`](../../type-aliases/undefinedinitialdatainfiniteoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\> & `object`

The tagged infinite query options.

The tagged infinite query options.

### Param

The infinite query options to tag with the type from `queryFn`.

### Defined in

[infinite-query-options.ts:158](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/infinite-query-options.ts#L158)
