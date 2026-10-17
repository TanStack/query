---
id: withHydrationKey
title: withHydrationKey
---

```ts
function withHydrationKey(key: string): QueryFeature;
```

Defined in: [packages/angular-query/src/providers.ts:173](https://github.com/TanStack/query/blob/main/packages/angular-query/src/providers.ts#L173)

Sets a non-default serialization key for this injector's `QueryClient` cache (server dehydrate /
browser hydrate via `TransferState`). Use this when you have multiple `QueryClient` instances
so each has its own key. The default key applies when you do not add this feature.

```ts
providers: [
  provideTanStackQuery(
    () => new QueryClient(),
    withHydrationKey('my-secondary-query-cache'),
  ),
]
```

## Parameters

### key

`string`

A unique string for this client's `TransferState` entry.

## Returns

[`QueryFeature`](../interfaces/QueryFeature.md)

A feature that stores this client's cache under the supplied key.
