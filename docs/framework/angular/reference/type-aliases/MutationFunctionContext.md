---
id: MutationFunctionContext
title: MutationFunctionContext
---

```ts
type MutationFunctionContext = object;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:1406

The object passed to `mutationFn` and the mutation callbacks: the `QueryClient`, the mutation's
`meta`, and its `mutationKey`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-client"></a> `client` | [`QueryClient`](../classes/QueryClient.md) | The `QueryClient` the mutation runs in. |
| <a id="property-meta"></a> `meta` | [`MutationMeta`](MutationMeta.md) \| `undefined` | The `meta` of the mutation options. |
| <a id="property-mutationkey"></a> `mutationKey?` | [`MutationKey`](MutationKey.md) | The `mutationKey` of the mutation options, if set. |
