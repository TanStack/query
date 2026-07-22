---
id: useInfiniteQuery
title: useInfiniteQuery
---

# Function: useInfiniteQuery()

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): DefinedUseInfiniteQueryResult<TData, TError>;
```

Defined in: packages/octane-query/src/useInfiniteQuery.ts:21

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

[`DefinedInitialDataInfiniteOptions`](../type-aliases/DefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### queryClient?

`QueryClient`

### Returns

[`DefinedUseInfiniteQueryResult`](../type-aliases/DefinedUseInfiniteQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryResult<TData, TError>;
```

Defined in: packages/octane-query/src/useInfiniteQuery.ts:38

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

[`UndefinedInitialDataInfiniteOptions`](../type-aliases/UndefinedInitialDataInfiniteOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### queryClient?

`QueryClient`

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function useInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseInfiniteQueryResult<TData, TError>;
```

Defined in: packages/octane-query/src/useInfiniteQuery.ts:55

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

[`UseInfiniteQueryOptions`](../interfaces/UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

#### queryClient?

`QueryClient`

### Returns

[`UseInfiniteQueryResult`](../type-aliases/UseInfiniteQueryResult.md)\<`TData`, `TError`\>
