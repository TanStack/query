---
id: defaultShouldDehydrateQuery
title: defaultShouldDehydrateQuery
---

```ts
function defaultShouldDehydrateQuery(query: Query): boolean;
```

Defined in: [packages/query-core/src/hydration.ts:213](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L213)

The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
`'success'`.

## Parameters

### query

[`Query`](../classes/Query.md)

The query to check.

## Returns

`boolean`

`true` if the query's status is `'success'`.
