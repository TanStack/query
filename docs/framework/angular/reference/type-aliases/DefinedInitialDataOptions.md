---
id: DefinedInitialDataOptions
title: DefinedInitialDataOptions
---

```ts
type DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & object;
```

Defined in: [packages/angular-query/src/query-options.ts:79](https://github.com/TanStack/query/blob/main/packages/angular-query/src/query-options.ts#L79)

The options accepted by the `queryOptions` overload selected when `initialData` is set — `data` is never
`undefined` (unless a `select` changes `TData` to include `undefined`).

## Type Declaration

### initialData

```ts
initialData: 
  | NonUndefinedGuard<TQueryFnData>
| () => NonUndefinedGuard<TQueryFnData>;
```

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

The type your `queryFn` resolves to.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TData

`TData` = `TQueryFnData`

The type `data` ends up as after `select` runs.

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

The type of your `queryKey`.
