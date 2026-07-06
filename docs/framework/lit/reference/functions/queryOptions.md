---
id: queryOptions
title: queryOptions
---

# Function: queryOptions()

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): Omit<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, never>, "queryFn"> & object & object;
```

Defined in: [packages/lit-query/src/queryOptions.ts:94](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L94)

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

`Omit`\<`QueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `never`\>, `"queryFn"`\> & `object` & `object`

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
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): OmitKeyof<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, never>, "queryFn"> & object & object;
```

Defined in: [packages/lit-query/src/queryOptions.ts:112](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L112)

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

`OmitKeyof`\<`QueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `never`\>, `"queryFn"`\> & `object` & `object`

The same options object with a typed `queryKey`.

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, never> & object & object;
```

Defined in: [packages/lit-query/src/queryOptions.ts:130](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L130)

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

`QueryObserverOptions`\<`TQueryFnData`, `TError`, `TData`, `TQueryFnData`, `TQueryKey`, `never`\> & `object` & `object`

The same options object with a typed `queryKey`.
