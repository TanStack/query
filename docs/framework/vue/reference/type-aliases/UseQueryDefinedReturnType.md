---
id: UseQueryDefinedReturnType
title: UseQueryDefinedReturnType
---

```ts
type UseQueryDefinedReturnType<TData, TError> = UseBaseQueryReturnType<TData, TError, DefinedQueryObserverResult<TData, TError>>;
```

Defined in: [packages/vue-query/src/useQuery.ts:30](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L30)

The result of `useQuery` when `initialData` is set — `data` is never `undefined` (unless a `select` changes
`TData` to include `undefined`).

## Type Parameters

### TData

`TData`

### TError

`TError`
