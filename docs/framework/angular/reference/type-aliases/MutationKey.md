---
id: MutationKey
title: MutationKey
---

```ts
type MutationKey = Register extends object ? TMutationKey extends ReadonlyArray<unknown> ? TMutationKey : TMutationKey extends unknown[] ? TMutationKey : ReadonlyArray<unknown> : ReadonlyArray<unknown>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:696
