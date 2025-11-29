---
id: QueryMeta
title: QueryMeta
---

# Type Alias: QueryMeta

```ts
type QueryMeta = Register extends object ? TQueryMeta extends Record<string, unknown> ? TQueryMeta : Record<string, unknown> : Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:209](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L209)
