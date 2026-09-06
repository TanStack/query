---
id: QueryCacheConfig
title: QueryCacheConfig
---

Defined in: packages/query-core/dist-ts/src/queryCache.d.ts:13

Global callbacks that fire for every query handled by a `QueryCache`, regardless of which
component or observer triggered it. Unlike `QueryClient`'s `defaultOptions`, which a query can
override, these callbacks are always called.

## Properties

### onError()?

```ts
optional onError: (error, query) => void;
```

Defined in: packages/query-core/dist-ts/src/queryCache.d.ts:15

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

Defined in: packages/query-core/dist-ts/src/queryCache.d.ts:19

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

Defined in: packages/query-core/dist-ts/src/queryCache.d.ts:17

Called when any query in the cache is successful.

#### Parameters

##### data

`unknown`

##### query

[`Query`](../classes/Query.md)\<`unknown`, `unknown`, `unknown`\>

#### Returns

`void`
