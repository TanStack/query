---
id: toResource
title: toResource
---

```ts
function toResource<TValue>(query: QueryResourceSource<TValue>): QueryResource<TValue>;
```

Defined in: packages/angular-query/src/query-resource.ts:41

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

<a id="result-properties"></a>

### Result properties

| Property | Modifier | Type | Description | Overrides |
| ------ | ------ | ------ | ------ | ------ |
| <a id="result-property-reload"></a> `reload` | `public` | () => `boolean` | Requests a new query fetch only when the current query data is stale. Used for compatibility with Angular APIs that might want to reload a resource, like Signal Forms' validateAsync resource interface. | - |
| <a id="result-property-snapshot"></a> `snapshot` | `readonly` | `Signal`\<`ResourceSnapshot`\<`TValue`\>\> | The current query state as a single snapshot. | `Resource.snapshot` |
