---
id: QueryCacheConfig
title: QueryCacheConfig
---

Defined in: packages/query-core/dist-ts/src/queryCache.d.ts:14

Global callbacks that fire for every query handled by a `QueryCache`, regardless of which
component or observer triggered it. Unlike `QueryClient`'s `defaultOptions`, which a query can
override, these callbacks are always called. Unlike `MutationCacheConfig`'s callbacks, these
are fire-and-forget: their return value is not awaited before the query settles.

## Properties

### onError()?

```ts
optional onError: (error, query) => void;
```

Defined in: packages/query-core/dist-ts/src/queryCache.d.ts:16

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

Defined in: packages/query-core/dist-ts/src/queryCache.d.ts:20

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

Defined in: packages/query-core/dist-ts/src/queryCache.d.ts:18

Called when any query in the cache is successful.

#### Parameters

##### data

`unknown`

##### query

[`Query`](../classes/Query.md)\<`unknown`, `unknown`, `unknown`\>

#### Returns

`void`
