---
id: QueryFunctionContext
title: QueryFunctionContext
---

```ts
type QueryFunctionContext<TQueryKey, TPageParam> = [TPageParam] extends [never] ? object : object;
```

Defined in: [packages/query-core/src/types.ts:224](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L224)

The object passed to `queryFn`: the `QueryClient`, the `queryKey`, an `AbortSignal` that aborts
when the query is cancelled, the query's `meta`, and for infinite queries the `pageParam` of the
page being fetched.

## Type Parameters

### TQueryKey

`TQueryKey` *extends* [`QueryKey`](QueryKey.md) = [`QueryKey`](QueryKey.md)

### TPageParam

`TPageParam` = `never`
