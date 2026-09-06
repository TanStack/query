---
id: QueryMeta
title: QueryMeta
---

```ts
type QueryMeta = Register extends object ? TQueryMeta extends Record<string, unknown> ? TQueryMeta : Record<string, unknown> : Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:215](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L215)
