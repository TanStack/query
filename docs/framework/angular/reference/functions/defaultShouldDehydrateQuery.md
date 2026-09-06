---
id: defaultShouldDehydrateQuery
title: defaultShouldDehydrateQuery
---

```ts
function defaultShouldDehydrateQuery(query): boolean;
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:82

The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
`'success'`.

## Parameters

### query

[`Query`](../classes/Query.md)

## Returns

`boolean`
