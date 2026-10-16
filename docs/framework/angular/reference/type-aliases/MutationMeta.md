---
id: MutationMeta
title: MutationMeta
---

```ts
type MutationMeta = Register extends object ? TMutationMeta extends Record<string, unknown> ? TMutationMeta : Record<string, unknown> : Record<string, unknown>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:1399

The type of the `meta` object that can be attached to a mutation and read back from `mutationFn`, callbacks and
cache-level handlers. Defaults to `Record<string, unknown>`; declare `mutationMeta` on [Register](../interfaces/Register.md) to narrow it.
