---
id: QueryPersister
title: QueryPersister
---

```ts
type QueryPersister<T, TQueryKey, TPageParam> = [TPageParam] extends [never] ? (queryFn, context, query) => T | Promise<T> : (queryFn, context, query) => T | Promise<T>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:46

## Type Parameters

### T

`T` = `unknown`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `never`
