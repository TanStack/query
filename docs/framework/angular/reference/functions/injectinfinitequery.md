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

The Angular injector to use.

## injectInfiniteQuery(optionsFn, injector)

```ts
function injectInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(optionsFn, injector?): CreateInfiniteQueryResult<TData, TError>
```

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

### Parameters

• **optionsFn**

A function that returns infinite query options.

• **injector?**: `Injector`

The Angular injector to use.

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/createinfinitequeryresult.md)\<`TData`, `TError`\>

The infinite query result.

The infinite query result.

### Param

A function that returns infinite query options.

### Param

The Angular injector to use.

### Defined in

[inject-infinite-query.ts:30](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/inject-infinite-query.ts#L30)

## injectInfiniteQuery(optionsFn, injector)

```ts
function injectInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(optionsFn, injector?): DefinedCreateInfiniteQueryResult<TData, TError>
```

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

### Parameters

• **optionsFn**

A function that returns infinite query options.

• **injector?**: `Injector`

The Angular injector to use.

### Returns

[`DefinedCreateInfiniteQueryResult`](../type-aliases/definedcreateinfinitequeryresult.md)\<`TData`, `TError`\>

The infinite query result.

The infinite query result.

### Param

A function that returns infinite query options.

### Param

The Angular injector to use.

### Defined in

[inject-infinite-query.ts:57](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/inject-infinite-query.ts#L57)

## injectInfiniteQuery(optionsFn, injector)

```ts
function injectInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
>(optionsFn, injector?): CreateInfiniteQueryResult<TData, TError>
```

Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"

### Type Parameters

• **TQueryFnData**

• **TError** = `Error`

• **TData** = `InfiniteData`\<`TQueryFnData`, `unknown`\>

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

• **TPageParam** = `unknown`

### Parameters

• **optionsFn**

A function that returns infinite query options.

• **injector?**: `Injector`

The Angular injector to use.

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/createinfinitequeryresult.md)\<`TData`, `TError`\>

The infinite query result.

The infinite query result.

### Param

A function that returns infinite query options.

### Param

The Angular injector to use.

### Defined in

[inject-infinite-query.ts:84](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/inject-infinite-query.ts#L84)
