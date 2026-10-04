---
id: MutationFunctionContext
title: MutationFunctionContext
---

```ts
type MutationFunctionContext = object;
```

Defined in: [packages/query-core/src/types.ts:1434](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1434)

The object passed to `mutationFn` and the mutation callbacks: the `QueryClient`, the mutation's
`meta`, and its `mutationKey`.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-client"></a> `client` | `QueryClient` |
| <a id="property-meta"></a> `meta` | [`MutationMeta`](MutationMeta.md) \| `undefined` |
| <a id="property-mutationkey"></a> `mutationKey?` | [`MutationKey`](MutationKey.md) |
