---
id: QueryFunctionContext
title: QueryFunctionContext
---

```ts
type QueryFunctionContext<TQueryKey, TPageParam> = [TPageParam] extends [never] ? object : object;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:47

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `never`
