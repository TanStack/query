---
id: defaultShouldDehydrateQuery
title: defaultShouldDehydrateQuery
---

```ts
function defaultShouldDehydrateQuery(query): boolean;
```

Defined in: [packages/query-core/src/hydration.ts:185](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L185)

The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
`'success'`.

## Parameters

### query

[`Query`](../classes/Query.md)

## Returns

`boolean`
