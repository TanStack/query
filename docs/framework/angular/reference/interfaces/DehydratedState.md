---
id: DehydratedState
title: DehydratedState
---

Defined in: [packages/query-core/src/hydration.ts:94](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L94)

A serializable snapshot of a `QueryClient`'s cache, as produced by `dehydrate` and consumed by `hydrate`. Typically
transported from server to client (e.g. embedded in server-rendered markup) to seed the client's cache with data
that has already been fetched, avoiding a redundant fetch on the client.

## Properties

### mutations

```ts
mutations: DehydratedMutation[];
```

Defined in: [packages/query-core/src/hydration.ts:95](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L95)

***

### queries

```ts
queries: DehydratedQuery[];
```

Defined in: [packages/query-core/src/hydration.ts:96](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L96)
