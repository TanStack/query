---
id: hydrate
title: hydrate
---

```ts
function hydrate(
   client, 
   dehydratedState, 
   options?): void;
```

Defined in: [packages/query-core/src/hydration.ts:264](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L264)

Restores a `DehydratedState` (as produced by `dehydrate`) into a `QueryClient`'s cache, typically to seed the
client with data already fetched on the server. `mutations` and `queries` are each optional on `dehydratedState`.
Queries not yet in the cache are built from the dehydrated snapshot; queries that already exist are only updated
when the dehydrated data is newer than what's already cached. Newly built queries have their `fetchStatus` reset
to `'idle'` so they don't hydrate stuck in a fetching state. If a dehydrated query still had an in-flight
promise, it is resumed via `query.fetch()` (reusing that promise as `initialPromise`) rather than re-invoking
`queryFn`.

## Parameters

### client

[`QueryClient`](../classes/QueryClient.md)

### dehydratedState

`Partial`\<[`DehydratedState`](../interfaces/DehydratedState.md)\>

### options?

[`HydrateOptions`](../interfaces/HydrateOptions.md)

## Returns

`void`

## Example

```ts
// dehydratedState was produced by `dehydrate` on the server
// and sent to the client, e.g. embedded in server-rendered markup.
const queryClient = new QueryClient()

hydrate(queryClient, dehydratedState)
```
