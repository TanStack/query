---
id: QueryKey
title: QueryKey
---

# Type Alias: QueryKey

```ts
type QueryKey = Register extends object ? TQueryKey extends ReadonlyArray<unknown> ? TQueryKey : TQueryKey extends unknown[] ? TQueryKey : ReadonlyArray<unknown> : ReadonlyArray<unknown>;
```

Defined in: [packages/query-core/src/types.ts:53](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L53)
