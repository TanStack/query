---
id: toResource
title: toResource
---

```ts
function toResource<TValue>(query): QueryResource<TValue>;
```

Defined in: [packages/angular-query/src/query-resource.ts:40](https://github.com/TanStack/query/blob/main/packages/angular-query/src/query-resource.ts#L40)

Converts an Angular Query result into Angular's Resource interface.

Call this function once and reuse the returned resource.

## Type Parameters

### TValue

`TValue`

## Parameters

### query

`QueryResourceSource`\<`TValue`\>

An Angular Query or infinite-query result.

## Returns

[`QueryResource`](../interfaces/QueryResource.md)\<`TValue`\>

A Resource-compatible view of the query result.
