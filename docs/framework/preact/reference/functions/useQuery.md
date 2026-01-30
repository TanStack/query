---
id: useQuery
title: useQuery
---

# Function: useQuery()

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): DefinedUseQueryResult<NoInfer<TData>, TError>;
```

Defined in: [preact-query/src/useQuery.ts:19](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/useQuery.ts#L19)

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

#### queryClient?

`QueryClient`

### Returns

[`DefinedUseQueryResult`](../type-aliases/DefinedUseQueryResult.md)\<`NoInfer`\<`TData`\>, `TError`\>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryResult<NoInfer<TData>, TError>;
```

Defined in: [preact-query/src/useQuery.ts:29](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/useQuery.ts#L29)

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

#### queryClient?

`QueryClient`

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`NoInfer`\<`TData`\>, `TError`\>

## Call Signature

```ts
function useQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): UseQueryResult<NoInfer<TData>, TError>;
```

Defined in: [preact-query/src/useQuery.ts:39](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/useQuery.ts#L39)

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

[`UseQueryOptions`](../interfaces/UseQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>

#### queryClient?

`QueryClient`

### Returns

[`UseQueryResult`](../type-aliases/UseQueryResult.md)\<`NoInfer`\<`TData`\>, `TError`\>
