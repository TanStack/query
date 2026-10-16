---
id: QueryMeta
title: QueryMeta
---

```ts
type QueryMeta = Register extends object ? TQueryMeta extends Record<string, unknown> ? TQueryMeta : Record<string, unknown> : Record<string, unknown>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:196

The type of the `meta` object that can be attached to a query and read back from `queryFn`, callbacks and
cache-level handlers. Defaults to `Record<string, unknown>`; declare `queryMeta` on [Register](../interfaces/Register.md) to narrow it.
