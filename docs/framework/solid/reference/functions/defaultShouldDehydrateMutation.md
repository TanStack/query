---
id: defaultShouldDehydrateMutation
title: defaultShouldDehydrateMutation
---

```ts
function defaultShouldDehydrateMutation(mutation: Mutation): boolean;
```

Defined in: [packages/query-core/src/hydration.ts:209](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L209)

The default `shouldDehydrateMutation` predicate used by `dehydrate`. Only dehydrates mutations that are
currently paused (e.g. paused by `networkMode` while offline).

## Parameters

### mutation

[`Mutation`](../classes/Mutation.md)

The mutation to check.

## Returns

`boolean`

`true` if the mutation is paused.
