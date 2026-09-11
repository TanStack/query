---
id: defaultShouldDehydrateMutation
title: defaultShouldDehydrateMutation
---

```ts
function defaultShouldDehydrateMutation(mutation): boolean;
```

Defined in: [packages/query-core/src/hydration.ts:177](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L177)

The default `shouldDehydrateMutation` predicate used by `dehydrate`. Only dehydrates mutations that are
currently paused (e.g. paused by `networkMode` while offline).

## Parameters

### mutation

[`Mutation`](../classes/Mutation.md)

## Returns

`boolean`
