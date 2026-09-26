---
id: queryOptions
title: queryOptions
---

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): Omit<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, never>, "queryFn"> & object & object;
```

Defined in: [packages/lit-query/src/queryOptions.ts:93](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L93)

Brands query options so the `queryKey` carries the query function data and
error types across TanStack Query APIs.

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

Query options to preserve and brand.

### Returns

`Omit`\<[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `never`\>, `"queryFn"`\> & `object` & `object`

The same options object with a typed `queryKey`.

### Example

```ts
import { queryOptions } from '@tanstack/lit-query'

const todosOptions = queryOptions({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  initialData: [],
})
```

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>): OmitKeyof<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, never>, "queryFn"> & object & object;
```

Defined in: [packages/lit-query/src/queryOptions.ts:111](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L111)

Brands query options so the `queryKey` carries the query function data and
error types across TanStack Query APIs.

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

Query options to preserve and brand.

### Returns

[`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `never`\>, `"queryFn"`\> & `object` & `object`

The same options object with a typed `queryKey`.

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, never> & object & object;
```

Defined in: [packages/lit-query/src/queryOptions.ts:129](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L129)

Brands query options so the `queryKey` carries the query function data and
error types across TanStack Query APIs.

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

Query options to preserve and brand.

### Returns

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `never`\> & `object` & `object`

The same options object with a typed `queryKey`.
