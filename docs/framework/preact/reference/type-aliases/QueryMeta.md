---
id: QueryMeta
title: QueryMeta
---

```ts
type QueryMeta = Register extends object ? TQueryMeta extends Record<string, unknown> ? TQueryMeta : Record<string, unknown> : Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:258](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L258)

The type of the `meta` object that can be attached to a query and read back from `queryFn`, callbacks and
cache-level handlers. Defaults to `Record<string, unknown>`; declare `queryMeta` on [Register](../interfaces/Register.md) to narrow it.
