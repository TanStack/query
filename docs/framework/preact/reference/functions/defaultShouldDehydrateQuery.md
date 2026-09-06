---
id: defaultShouldDehydrateQuery
title: defaultShouldDehydrateQuery
---

```ts
function defaultShouldDehydrateQuery(query): boolean;
```

Defined in: [packages/query-core/src/hydration.ts:188](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L188)

The default `shouldDehydrateQuery` predicate used by `dehydrate`. Only dehydrates queries whose status is
`'success'`.

## Parameters

### query

[`Query`](../classes/Query.md)

## Returns

`boolean`
