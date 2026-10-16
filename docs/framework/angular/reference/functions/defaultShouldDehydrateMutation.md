---
id: defaultShouldDehydrateMutation
title: defaultShouldDehydrateMutation
---

```ts
function defaultShouldDehydrateMutation(mutation: Mutation): boolean;
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:87

The default `shouldDehydrateMutation` predicate used by `dehydrate`. Only dehydrates mutations that are
currently paused (e.g. paused by `networkMode` while offline).

## Parameters

### mutation

[`Mutation`](../classes/Mutation.md)

The mutation to check.

## Returns

`boolean`

`true` if the mutation is paused.
