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

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onerror"></a> `onError?` | (`error`: `Error`, `query`: [`Query`](../classes/Query.md)\<`unknown`, `unknown`, `unknown`\>) => `void` | Called when any query in the cache encounters an error. |
| <a id="onsettled"></a> `onSettled?` | (`data`: `unknown`, `error`: `Error` \| `null`, `query`: [`Query`](../classes/Query.md)\<`unknown`, `unknown`, `unknown`\>) => `void` | Called when any query in the cache is settled, either successfully or with an error. |
| <a id="onsuccess"></a> `onSuccess?` | (`data`: `unknown`, `query`: [`Query`](../classes/Query.md)\<`unknown`, `unknown`, `unknown`\>) => `void` | Called when any query in the cache is successful. |
