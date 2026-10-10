---
id: UseQueryReturnType
title: UseQueryReturnType
---

```ts
type UseQueryReturnType<TData, TError> = UseBaseQueryReturnType<TData, TError>;
```

Defined in: [packages/vue-query/src/useQuery.ts:21](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQuery.ts#L21)

The result of `useQuery` when `initialData` is omitted or may be `undefined` — `data` may be `undefined`
while the query is `pending`. See UseBaseQueryReturnType.

## Type Parameters

### TData

`TData`

### TError

`TError`
