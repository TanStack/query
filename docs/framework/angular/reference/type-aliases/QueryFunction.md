---
id: QueryFunction
title: QueryFunction
---

```ts
type QueryFunction<T, TQueryKey, TPageParam> = (context) => T | Promise<T>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:42

## Type Parameters

### T

`T` = `unknown`

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `never`

## Parameters

### context

[`QueryFunctionContext`](QueryFunctionContext.md)\<`TQueryKey`, `TPageParam`\>

## Returns

`T` \| `Promise`\<`T`\>
