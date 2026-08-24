---
id: queryOptions
title: queryOptions
---

Allows sharing and re-using query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

**Example**

```ts
 const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
    //  ^?  Promise<number>
  })

  const queryClient = new QueryClient()
  const data = queryClient.getQueryData(queryKey)
  //    ^?  number | undefined
```

## Param

The query options to tag with the type from `queryFn`.

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): Omit<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [query-options.ts:76](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L76)

Allows sharing and re-using query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

**Example**

```ts
 const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
    //  ^?  Promise<number>
  })

  const queryClient = new QueryClient()
  const data = queryClient.getQueryData(queryKey)
  //    ^?  number | undefined
```

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

The query options to tag with the type from `queryFn`.

### Returns

`Omit`\<[`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `TQueryFnData`, `TError`\>

The tagged query options.

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): OmitKeyof<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [query-options.ts:107](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L107)

Allows sharing and re-using query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

**Example**

```ts
 const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
    //  ^?  Promise<number>
  })

  const queryClient = new QueryClient()
  const data = queryClient.getQueryData(queryKey)
  //    ^?  number | undefined
```

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

The query options to tag with the type from `queryFn`.

### Returns

`OmitKeyof`\<[`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `TQueryFnData`, `TError`\>

The tagged query options.

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>;
```

Defined in: [query-options.ts:138](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L138)

Allows sharing and re-using query options in a type-safe way.

The `queryKey` will be tagged with the type from `queryFn`.

**Example**

```ts
 const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
    //  ^?  Promise<number>
  })

  const queryClient = new QueryClient()
  const data = queryClient.getQueryData(queryKey)
  //    ^?  number | undefined
```

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

The query options to tag with the type from `queryFn`.

### Returns

[`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & `QueryKeyWithDataTag`\<`TQueryKey`, `TQueryFnData`, `TError`\>

The tagged query options.
