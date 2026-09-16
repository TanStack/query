---
id: withHydrationKey
title: withHydrationKey
---

```ts
function withHydrationKey(key): QueryFeature;
```

Defined in: [packages/angular-query/src/providers.ts:167](https://github.com/TanStack/query/blob/main/packages/angular-query/src/providers.ts#L167)

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
