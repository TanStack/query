---
id: UndefinedInitialDataOptions
title: UndefinedInitialDataOptions
---

```ts
type UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?:   | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
     | NonUndefinedGuard<TQueryFnData>;
};
```

Defined in: [packages/svelte-query/src/queryOptions.ts:14](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/queryOptions.ts#L14)

The options accepted by the `queryOptions` overload selected when `initialData` is omitted or may be
`undefined` — `data` may be `undefined` while the query is `pending`.

## Type Declaration

### initialData?

```ts
optional initialData?: 
  | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
| NonUndefinedGuard<TQueryFnData>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)
