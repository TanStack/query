---
id: injectInfiniteQuery
title: injectInfiniteQuery
---

# Function: injectInfiniteQuery()

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"

## Param

A function that returns infinite query options.

## Param

Additional configuration.

## Call Signature

```ts
function injectInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(
  injectInfiniteQueryFn,
  options?,
): DefinedCreateInfiniteQueryResult<TData, TError>
```

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

• **TPageParam** = `unknown`

### Parameters

#### injectInfiniteQueryFn

() => [`DefinedInitialDataInfiniteOptions`](../../type-aliases/definedinitialdatainfiniteoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function that returns infinite query options.

#### options?

[`InjectInfiniteQueryOptions`](../../interfaces/injectinfinitequeryoptions.md)

Additional configuration.

### Returns

[`DefinedCreateInfiniteQueryResult`](../../type-aliases/definedcreateinfinitequeryresult.md)\<`TData`, `TError`\>

The infinite query result.

The infinite query result.

### Param

A function that returns infinite query options.

### Param

Additional configuration.

### Defined in

[inject-infinite-query.ts:42](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L42)

## Call Signature

```ts
function injectInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(injectInfiniteQueryFn, options?): CreateInfiniteQueryResult<TData, TError>
```

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

• **TPageParam** = `unknown`

### Parameters

#### injectInfiniteQueryFn

() => [`UndefinedInitialDataInfiniteOptions`](../../type-aliases/undefinedinitialdatainfiniteoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

A function that returns infinite query options.

#### options?

[`InjectInfiniteQueryOptions`](../../interfaces/injectinfinitequeryoptions.md)

Additional configuration.

### Returns

[`CreateInfiniteQueryResult`](../../type-aliases/createinfinitequeryresult.md)\<`TData`, `TError`\>

The infinite query result.

The infinite query result.

### Param

A function that returns infinite query options.

### Param

Additional configuration.

### Defined in

[inject-infinite-query.ts:67](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L67)

## Call Signature

```ts
function injectInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(injectInfiniteQueryFn, options?): CreateInfiniteQueryResult<TData, TError>
```

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ readonly `unknown`[] = readonly `unknown`[]

• **TPageParam** = `unknown`

### Parameters

#### injectInfiniteQueryFn

() => [`CreateInfiniteQueryOptions`](../../interfaces/createinfinitequeryoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `TPageParam`\>

A function that returns infinite query options.

#### options?

[`InjectInfiniteQueryOptions`](../../interfaces/injectinfinitequeryoptions.md)

Additional configuration.

### Returns

[`CreateInfiniteQueryResult`](../../type-aliases/createinfinitequeryresult.md)\<`TData`, `TError`\>

The infinite query result.

The infinite query result.

### Param

A function that returns infinite query options.

### Param

Additional configuration.

### Defined in

[inject-infinite-query.ts:92](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-infinite-query.ts#L92)
