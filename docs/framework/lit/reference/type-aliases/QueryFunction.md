---
id: QueryFunction
title: QueryFunction
---

```ts
type QueryFunction<T, TQueryKey, TPageParam> = (context: QueryFunctionContext<TQueryKey, TPageParam>) => T | Promise<T>;
```

Defined in: [packages/query-core/src/types.ts:103](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L103)

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
