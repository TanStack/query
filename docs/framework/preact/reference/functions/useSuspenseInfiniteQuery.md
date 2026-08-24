---
id: useSuspenseInfiniteQuery
title: useSuspenseInfiniteQuery
---

```ts
function useSuspenseInfiniteQuery<TQueryFnData, TError, TData, TQueryKey, TPageParam>(options, queryClient?): UseSuspenseInfiniteQueryResult<TData, TError>;
```

Defined in: [preact-query/src/useSuspenseInfiniteQuery.ts:28](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseInfiniteQuery.ts#L28)

The options for `useSuspenseInfiniteQuery` are the same as for `useInfiniteQuery`, except for `throwOnError`,
`enabled`, and `placeholderData`.

## Type Parameters

### TQueryFnData

`TQueryFnData`

### TError

`TError` = `Error`

### TData

`TData` = `InfiniteData`\<`TQueryFnData`, `unknown`\>

### TQueryKey

`TQueryKey` *extends* readonly `unknown`[] = readonly `unknown`[]

### TPageParam

`TPageParam` = `unknown`

## Parameters

### options

[`UseSuspenseInfiniteQueryOptions`](../interfaces/UseSuspenseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>

### queryClient?

`QueryClient`

## Returns

[`UseSuspenseInfiniteQueryResult`](../type-aliases/UseSuspenseInfiniteQueryResult.md)\<`TData`, `TError`\>

The same object as `useInfiniteQuery`, except that `data` is guaranteed to be defined,
`isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived flags set
accordingly).

Caveat: cancellation does not work.
