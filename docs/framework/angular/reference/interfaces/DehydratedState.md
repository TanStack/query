---
id: DehydratedState
title: DehydratedState
---

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:58

A serializable snapshot of a `QueryClient`'s cache, as produced by `dehydrate` and consumed by `hydrate`. Typically
transported from server to client (e.g. embedded in server-rendered markup) to seed the client's cache with data
that has already been fetched, avoiding a redundant fetch on the client.

## Properties

### mutations

```ts
mutations: DehydratedMutation[];
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:59

***

### queries

```ts
queries: DehydratedQuery[];
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:60
