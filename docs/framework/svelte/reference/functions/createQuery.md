---
id: createQuery
title: createQuery
---

# Function: createQuery()

## Call Signature

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): CreateQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createQuery.ts:15](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQuery.ts#L15)

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

[`Accessor`](../../type-aliases/Accessor.md)\<[`UndefinedInitialDataOptions`](../../type-aliases/UndefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

#### queryClient?

[`Accessor`](../../type-aliases/Accessor.md)\<`QueryClient`\>

### Returns

[`CreateQueryResult`](../../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): DefinedCreateQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createQuery.ts:27](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQuery.ts#L27)

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

[`Accessor`](../../type-aliases/Accessor.md)\<[`DefinedInitialDataOptions`](../../type-aliases/DefinedInitialDataOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

#### queryClient?

[`Accessor`](../../type-aliases/Accessor.md)\<`QueryClient`\>

### Returns

[`DefinedCreateQueryResult`](../../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>

## Call Signature

```ts
function createQuery<TQueryFnData, TError, TData, TQueryKey>(options, queryClient?): CreateQueryResult<TData, TError>;
```

Defined in: [packages/svelte-query/src/createQuery.ts:39](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQuery.ts#L39)

### Type Parameters

#### TQueryFnData

`TQueryFnData`

#### TError

`TError` = `Error`

#### TData

`TData` = `TQueryFnData`

#### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### Parameters

#### options

[`Accessor`](../../type-aliases/Accessor.md)\<[`CreateQueryOptions`](../../type-aliases/CreateQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>\>

#### queryClient?

[`Accessor`](../../type-aliases/Accessor.md)\<`QueryClient`\>

### Returns

[`CreateQueryResult`](../../type-aliases/CreateQueryResult.md)\<`TData`, `TError`\>
