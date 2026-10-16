---
id: DehydratedState
title: DehydratedState
---

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:59

A serializable snapshot of a `QueryClient`'s cache, as produced by `dehydrate` and consumed by `hydrate`. Typically
transported from server to client (e.g. embedded in server-rendered markup) to seed the client's cache with data
that has already been fetched, avoiding a redundant fetch on the client.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-mutations"></a> `mutations` | `DehydratedMutation`[] | The dehydrated mutations, by default only the paused ones. |
| <a id="property-queries"></a> `queries` | `DehydratedQuery`[] | The dehydrated queries, by default only the successful ones. |
