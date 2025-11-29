---
id: QueryFunction
title: QueryFunction
---

# Type Alias: QueryFunction()\<T, TQueryKey, TPageParam\>

```ts
type QueryFunction<T, TQueryKey, TPageParam> = (context) => T | Promise<T>;
```

Defined in: [packages/query-core/src/types.ts:96](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L96)

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
