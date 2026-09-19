---
id: QueryKey
title: QueryKey
---

```ts
type QueryKey = Register extends object ? TQueryKey extends ReadonlyArray<unknown> ? TQueryKey : TQueryKey extends unknown[] ? TQueryKey : ReadonlyArray<unknown> : ReadonlyArray<unknown>;
```

Defined in: [packages/query-core/src/types.ts:78](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L78)

The type of a query key — the serializable array that identifies a query in the cache.
Defaults to `ReadonlyArray<unknown>`; declare `queryKey` on [Register](../interfaces/Register.md) to narrow it repository-wide.
