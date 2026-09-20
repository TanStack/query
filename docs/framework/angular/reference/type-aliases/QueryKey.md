---
id: QueryKey
title: QueryKey
---

```ts
type QueryKey = Register extends object ? TQueryKey extends ReadonlyArray<unknown> ? TQueryKey : TQueryKey extends unknown[] ? TQueryKey : ReadonlyArray<unknown> : ReadonlyArray<unknown>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:20
