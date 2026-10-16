---
id: defaultShouldDehydrateQuery
title: defaultShouldDehydrateQuery
---

```ts
function defaultShouldDehydrateQuery(query: Query): boolean;
```

Defined in: packages/query-core/dist-ts/src/hydration.d.ts:94

The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
`'success'`.

## Parameters

### query

[`Query`](../classes/Query.md)

The query to check.

## Returns

`boolean`

`true` if the query's status is `'success'`.
