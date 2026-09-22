---
id: DefaultOptions
title: DefaultOptions
---

Defined in: [packages/solid-query/src/QueryClient.ts:96](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L96)

The default options a `QueryClient` applies to every query, with Solid's `reconcile` option added to
`queries`.

## Extends

- `DefaultOptions`\<`TError`\>

## Type Parameters

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The default type of errors thrown by queries and mutations using this `QueryClient`.

## Properties

| Property | Type | Description | Overrides |
| ------ | ------ | ------ | ------ |
| <a id="dehydrate"></a> `dehydrate?` | [`DehydrateOptions`](DehydrateOptions.md) | Default options used when dehydrating the client's caches; see [DehydrateOptions](DehydrateOptions.md). | - |
| <a id="hydrate"></a> `hydrate?` | `object` | Default options used when hydrating queries; see [HydrateOptions](HydrateOptions.md). | - |
| `hydrate.deserializeData?` | `TransformerFn` | Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`. | - |
| `hydrate.mutations?` | `MutationOptions`\<`unknown`, `Error`, `unknown`, `unknown`\> | Default options merged into every mutation restored from the dehydrated state. | - |
| `hydrate.queries?` | `QueryOptions`\<`unknown`, `Error`, `unknown`, readonly `unknown`[], `never`\> | Default options merged into every query restored from the dehydrated state. | - |
| <a id="mutations"></a> `mutations?` | [`MutationObserverOptions`](MutationObserverOptions.md)\<`unknown`, `TError`, `unknown`, `unknown`\> | Default options applied to every mutation, unless overridden per-mutation. | - |
| <a id="queries"></a> `queries?` | [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`QueryObserverOptions`](QueryObserverOptions.md)\<`unknown`, `TError`, `unknown`, `unknown`, readonly `unknown`[], `never`\>, `"queryKey"`\> | Default options applied to every query, unless overridden per-query. | `CoreDefaultOptions.queries` |
