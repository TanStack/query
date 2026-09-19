---
id: MutationKey
title: MutationKey
---

```ts
type MutationKey = Register extends object ? TMutationKey extends ReadonlyArray<unknown> ? TMutationKey : TMutationKey extends unknown[] ? TMutationKey : ReadonlyArray<unknown> : ReadonlyArray<unknown>;
```

Defined in: [packages/query-core/src/types.ts:1227](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1227)

The type of a mutation key — the serializable array used to identify and filter mutations.
Defaults to `ReadonlyArray<unknown>`; declare `mutationKey` on [Register](../interfaces/Register.md) to narrow it repository-wide.
