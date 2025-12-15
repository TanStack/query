---
id: queryOptions
title: queryOptions
---

# Function: queryOptions()

Allows to share and re-use query options in a type-safe way.

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
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): Omit<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & object;
```

Defined in: [query-options.ts:76](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L76)

Allows to share and re-use query options in a type-safe way.

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

`Omit`\<[`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"`\> & `object` & `object`

The tagged query options.

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): OmitKeyof<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryFn"> & object & object;
```

Defined in: [query-options.ts:108](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L108)

Allows to share and re-use query options in a type-safe way.

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

`OmitKeyof`\<[`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>, `"queryFn"`\> & `object` & `object`

The tagged query options.

## Call Signature

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(options): CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object & object;
```

Defined in: [query-options.ts:140](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/query-options.ts#L140)

Allows to share and re-use query options in a type-safe way.

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

[`CreateQueryOptions`](../interfaces/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object` & `object`

The tagged query options.
