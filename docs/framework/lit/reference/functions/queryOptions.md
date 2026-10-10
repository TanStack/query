---
id: queryOptions
title: queryOptions
---

## Overview

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
};
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
};
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
};
```

- [`DefinedInitialDataOptions` → `DefinedInitialDataOptions & { queryKey }`](#call-signature-1): Brands query options so the `queryKey` carries the query function data and error types across TanStack Query APIs.
- [`UnusedSkipTokenOptions` → `UnusedSkipTokenOptions & { queryKey }`](#call-signature-2): Brands query options so the `queryKey` carries the query function data and error types across TanStack Query APIs.
- [`UndefinedInitialDataOptions` → `UndefinedInitialDataOptions & { queryKey }`](#call-signature-3): Brands query options so the `queryKey` carries the query function data and error types across TanStack Query APIs.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
};
```

Defined in: [packages/lit-query/src/queryOptions.ts:92](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L92)

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

[`DefinedInitialDataOptions`](../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & \{
  `queryKey`: [`DataTag`](../type-aliases/DataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>;
\}

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

<a id="call-signature-2"></a>

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
};
```

Defined in: [packages/lit-query/src/queryOptions.ts:109](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L109)

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

[`UnusedSkipTokenOptions`](../type-aliases/UnusedSkipTokenOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & \{
  `queryKey`: [`DataTag`](../type-aliases/DataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>;
\}

The same options object with a typed `queryKey`.

<a id="call-signature-3"></a>

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>;
};
```

Defined in: [packages/lit-query/src/queryOptions.ts:126](https://github.com/TanStack/query/blob/main/packages/lit-query/src/queryOptions.ts#L126)

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

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & \{
  `queryKey`: [`DataTag`](../type-aliases/DataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>;
\}

The same options object with a typed `queryKey`.

<a id="parameters-summary"></a>

## Parameters

### options

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

Query options to preserve and brand.

<a id="options-properties"></a>

#### `options` properties

Built from [`QueryObserverOptions`](../interfaces/QueryObserverOptions.md#properties). See the type above for what it changes.

<a id="returns-summary"></a>

## Returns

[`UndefinedInitialDataOptions`](../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & \{
  `queryKey`: [`DataTag`](../type-aliases/DataTag.md)\<`TQueryKey`, `TQueryFnData`, `TError`\>;
\}

The same options object with a typed `queryKey`.

<a id="result-properties"></a>

### Result properties

Built from [`QueryObserverOptions`](../interfaces/QueryObserverOptions.md#properties). See the type above for what it changes.
