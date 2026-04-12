---
id: withHydrationKey
title: withHydrationKey
---

# Function: withHydrationKey()

```ts
function withHydrationKey(key): QueryFeature<"Hydration">;
```

Defined in: [providers.ts:233](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L233)

Sets a non-default serialization key for this injector's `QueryClient` cache (server dehydrate /
browser hydrate via `TransferState`). Use this when you have multiple `QueryClient` instances
so each has its own key. The default key applies when you do not add this feature.

```ts
providers: [
  ...provideTanStackQuery(secondaryClient, withHydrationKey('my-secondary-query-cache')),
]
```

## Parameters

### key

`string`

A unique string for this client's `TransferState` entry.

## Returns

[`QueryFeature`](../interfaces/QueryFeature.md)\<`"Hydration"`\>
