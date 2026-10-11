---
id: DefaultOptions
title: DefaultOptions
---

Defined in: [packages/query-core/src/types.ts:2377](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L2377)

The default options of a `QueryClient`, applied to every query (`queries`), mutation
(`mutations`), `hydrate`, and `dehydrate` call unless overridden.

## Type Parameters

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-dehydrate"></a> `dehydrate?` | [`DehydrateOptions`](DehydrateOptions.md) | Default options used when dehydrating the client's caches; see [DehydrateOptions](DehydrateOptions.md). |
| <a id="property-hydrate"></a> `hydrate?` | `object` | Default options used when hydrating queries and mutations; see [HydrateOptions](HydrateOptions.md). |
| `hydrate.deserializeData?` | `TransformerFn` | Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`. |
| `hydrate.mutations?` | [`MutationOptions`](MutationOptions.md)\<`unknown`, `Error`, `unknown`, `unknown`\> | Default options merged into every mutation restored from the dehydrated state. |
| `hydrate.queries?` | [`QueryOptions`](QueryOptions.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[], `never`\> | Default options merged into every query restored from the dehydrated state. |
| <a id="property-mutations"></a> `mutations?` | [`MutationObserverOptions`](MutationObserverOptions.md)\<`unknown`, `TError`, `unknown`, `unknown`\> | Default options applied to every mutation, unless overridden per-mutation. |
| <a id="property-queries"></a> `queries?` | [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`QueryObserverOptions`](QueryObserverOptions.md)\<`unknown`, `TError`, `unknown`, `unknown`, readonly `unknown`[], `never`\>, `"queryKey"` \| `"suspense"`, `"strictly"`\> | Default options applied to every query, unless overridden per-query. |
