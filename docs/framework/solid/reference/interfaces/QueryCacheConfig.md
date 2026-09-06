---
id: QueryCacheConfig
title: QueryCacheConfig
---

Defined in: [packages/query-core/src/queryCache.ts:24](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L24)

Global callbacks that fire for every query handled by a `QueryCache`, regardless of which
component or observer triggered it. Unlike `QueryClient`'s `defaultOptions`, which a query can
override, these callbacks are always called.

## Properties

### onError()?

```ts
optional onError: (error, query) => void;
```

Defined in: [packages/query-core/src/queryCache.ts:26](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L26)

Called when any query in the cache encounters an error.

#### Parameters

##### error

`Error`

##### query

[`Query`](../classes/Query.md)\<`unknown`, `unknown`, `unknown`\>

#### Returns

`void`

***

### onSettled()?

```ts
optional onSettled: (data, error, query) => void;
```

Defined in: [packages/query-core/src/queryCache.ts:33](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L33)

Called when any query in the cache is settled, either successfully or with an error.

#### Parameters

##### data

`unknown`

##### error

`Error` | `null`

##### query

[`Query`](../classes/Query.md)\<`unknown`, `unknown`, `unknown`\>

#### Returns

`void`

***

### onSuccess()?

```ts
optional onSuccess: (data, query) => void;
```

Defined in: [packages/query-core/src/queryCache.ts:31](https://github.com/TanStack/query/blob/main/packages/query-core/src/queryCache.ts#L31)

Called when any query in the cache is successful.

#### Parameters

##### data

`unknown`

##### query

[`Query`](../classes/Query.md)\<`unknown`, `unknown`, `unknown`\>

#### Returns

`void`
