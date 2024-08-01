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

## queryOptions(options)

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

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

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **options**: [`UndefinedInitialDataOptions`](../type-aliases/undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The query options to tag with the type from `queryFn`.

### Returns

[`UndefinedInitialDataOptions`](../type-aliases/undefinedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

The tagged query options.

The tagged query options.

### Param

The query options to tag with the type from `queryFn`.

### Defined in

[query-options.ts:52](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/query-options.ts#L52)

## queryOptions(options)

```ts
function queryOptions<TQueryFnData, TError, TData, TQueryKey>(
  options,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & object
```

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

• **TQueryFnData** = `unknown`

• **TError** = `Error`

• **TData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

### Parameters

• **options**: [`DefinedInitialDataOptions`](../type-aliases/definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

The query options to tag with the type from `queryFn`.

### Returns

[`DefinedInitialDataOptions`](../type-aliases/definedinitialdataoptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\> & `object`

The tagged query options.

The tagged query options.

### Param

The query options to tag with the type from `queryFn`.

### Defined in

[query-options.ts:85](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/query-options.ts#L85)
