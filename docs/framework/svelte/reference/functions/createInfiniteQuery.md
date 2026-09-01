---
id: createInfiniteQuery
title: createInfiniteQuery
---

## Call Signature

```ts
function createInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): DefinedCreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createInfiniteQuery.ts:21](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createInfiniteQuery.ts#L21)

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

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

[`Accessor`](../type-aliases/Accessor.md)\<[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<`QueryClient`\>

### Returns

[`DefinedCreateInfiniteQueryResult`](../type-aliases/DefinedCreateInfiniteQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function createInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createInfiniteQuery.ts:40](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createInfiniteQuery.ts#L40)

### Type Parameters

#### TQueryFnData

`TQueryFnData` = `unknown`

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

[`Accessor`](../type-aliases/Accessor.md)\<[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<`QueryClient`\>

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function createInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): CreateInfiniteQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createInfiniteQuery.ts:59](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createInfiniteQuery.ts#L59)

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

[`Accessor`](../type-aliases/Accessor.md)\<[`CreateInfiniteQueryOptions`](../type-aliases/CreateInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>\>

#### queryClient?

[`Accessor`](../type-aliases/Accessor.md)\<`QueryClient`\>

### Returns

[`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>
