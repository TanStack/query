---
id: QueryMeta
title: QueryMeta
---

```ts
type QueryMeta = Register extends object ? TQueryMeta extends Record<string, unknown> ? TQueryMeta : Record<string, unknown> : Record<string, unknown>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:81
