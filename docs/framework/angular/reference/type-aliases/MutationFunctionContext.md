---
id: MutationFunctionContext
title: MutationFunctionContext
---

```ts
type MutationFunctionContext = object;
```

Defined in: [packages/query-core/src/types.ts:1849](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1849)

The object passed to `mutationFn` and the mutation callbacks: the `QueryClient`, the mutation's
`meta`, and its `mutationKey`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-client"></a> `client` | [`QueryClient`](../classes/QueryClient.md) | The `QueryClient` the mutation runs in. |
| <a id="property-meta"></a> `meta` | [`MutationMeta`](MutationMeta.md) \| `undefined` | The `meta` of the mutation options. |
| <a id="property-mutationkey"></a> `mutationKey?` | [`MutationKey`](MutationKey.md) | The `mutationKey` of the mutation options, if set. |
