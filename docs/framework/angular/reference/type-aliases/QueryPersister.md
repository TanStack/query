---
id: QueryPersister
title: QueryPersister
---

```ts
type QueryPersister<T, TQueryKey, TPageParam> = [TPageParam] extends [never] ? (queryFn: QueryFunction<T, TQueryKey, never>, context: QueryFunctionContext<TQueryKey>, query: Query) => T | Promise<T> : (queryFn: QueryFunction<T, TQueryKey, TPageParam>, context: QueryFunctionContext<TQueryKey>, query: Query) => T | Promise<T>;
```

Defined in: [packages/query-core/src/types.ts:128](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L128)

## Type Parameters

### T

`T` = `unknown`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `never`
