---
id: UseSuspenseInfiniteQueryOptions
title: UseSuspenseInfiniteQueryOptions
---

Defined in: [preact-query/src/types.ts:127](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L127)

## Extends

- `OmitKeyof`\<[`UseInfiniteQueryOptions`](UseInfiniteQueryOptions.md)\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`, `TPageParam`\>, `"queryFn"` \| `"enabled"` \| `"throwOnError"` \| `"placeholderData"`\>

## Type Parameters

### TQueryFnData

`TQueryFnData` = `unknown`

### TError

`TError` = `DefaultError`

### TData

`TData` = `TQueryFnData`

### TQueryKey

`TQueryKey` *extends* `QueryKey` = `QueryKey`

### TPageParam

`TPageParam` = `unknown`

## Properties

### queryFn?

```ts
optional queryFn: QueryFunction<TQueryFnData, TQueryKey, TPageParam>;
```

Defined in: [preact-query/src/types.ts:137](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L137)

***

### subscribed?

```ts
optional subscribed: boolean;
```

Defined in: [preact-query/src/types.ts:122](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L122)

Set this to `false` to unsubscribe this observer from updates to the query cache.
Defaults to `true`.

#### Inherited from

```ts
OmitKeyof.subscribed
```
