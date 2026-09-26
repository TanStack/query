---
id: MutationMeta
title: MutationMeta
---

```ts
type MutationMeta = Register extends object ? TMutationMeta extends Record<string, unknown> ? TMutationMeta : Record<string, unknown> : Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1251](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1251)

The type of the `meta` object that can be attached to a mutation and read back from `mutationFn`, callbacks and
cache-level handlers. Defaults to `Record<string, unknown>`; declare `mutationMeta` on [Register](../interfaces/Register.md) to narrow it.
