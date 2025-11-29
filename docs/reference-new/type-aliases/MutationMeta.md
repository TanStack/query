---
id: MutationMeta
title: MutationMeta
---

# Type Alias: MutationMeta

```ts
type MutationMeta = Register extends object ? TMutationMeta extends Record<string, unknown> ? TMutationMeta : Record<string, unknown> : Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1086](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1086)
