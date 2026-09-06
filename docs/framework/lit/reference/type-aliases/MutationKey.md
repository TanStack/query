---
id: MutationKey
title: MutationKey
---

```ts
type MutationKey = Register extends object ? TMutationKey extends ReadonlyArray<unknown> ? TMutationKey : TMutationKey extends unknown[] ? TMutationKey : ReadonlyArray<unknown> : ReadonlyArray<unknown>;
```

Defined in: [packages/query-core/src/types.ts:1165](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1165)
