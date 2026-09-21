---
id: defaultShouldDehydrateQuery
title: defaultShouldDehydrateQuery
---

```ts
function defaultShouldDehydrateQuery(query: Query): boolean;
```

Defined in: [packages/query-core/src/hydration.ts:186](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L186)

The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
`'success'`.

## Parameters

### query

[`Query`](../classes/Query.md)

## Returns

`boolean`
