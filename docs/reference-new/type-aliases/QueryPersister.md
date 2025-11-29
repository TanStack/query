---
id: QueryPersister
title: QueryPersister
---

# Type Alias: QueryPersister\<T, TQueryKey, TPageParam\>

```ts
type QueryPersister<T, TQueryKey, TPageParam> = [TPageParam] extends [never] ? (queryFn, context, query) => T | Promise<T> : (queryFn, context, query) => T | Promise<T>;
```

Defined in: [packages/query-core/src/types.ts:122](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L122)

## Type Parameters

### T

`T` = `unknown`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `never`
