---
id: MutationKey
title: MutationKey
---

# Type Alias: MutationKey

```ts
type MutationKey = Register extends object ? TMutationKey extends ReadonlyArray<unknown> ? TMutationKey : TMutationKey extends unknown[] ? TMutationKey : ReadonlyArray<unknown> : ReadonlyArray<unknown>;
```

Defined in: [packages/query-core/src/types.ts:1070](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1070)
