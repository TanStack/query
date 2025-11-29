---
id: QueryFunctionContext
title: QueryFunctionContext
---

# Type Alias: QueryFunctionContext\<TQueryKey, TPageParam\>

```ts
type QueryFunctionContext<TQueryKey, TPageParam> = [TPageParam] extends [never] ? object : object;
```

Defined in: [packages/query-core/src/types.ts:138](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L138)

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `never`
