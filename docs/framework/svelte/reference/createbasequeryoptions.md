# Type Alias: CreateBaseQueryOptions\<TQueryFnData, TError, TData, TQueryData, TQueryKey\>

```ts
type CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
```

Options for createBaseQuery

## Type Parameters

• **TQueryFnData** = `unknown`

• **TError** = `DefaultError`

• **TData** = `TQueryFnData`

• **TQueryData** = `TQueryFnData`

• **TQueryKey** _extends_ `QueryKey` = `QueryKey`

## Defined in

[packages/svelte-query/src/types.ts:23](https://github.com/TanStack/query/blob/81ca3332486f7b98502d4f5ea50588d88a80f59b/packages/svelte-query/src/types.ts#L23)
