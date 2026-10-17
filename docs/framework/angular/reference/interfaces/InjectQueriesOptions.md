---
id: InjectQueriesOptions
title: InjectQueriesOptions
---

Defined in: packages/angular-query/src/inject-queries.types.ts:226

A reactive group of query options and an optional projection of their combined results.

## Type Parameters

### T

`T` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = [`QueriesResults`](../type-aliases/QueriesResults.md)\<`T`\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-combine"></a> `combine?` | (`result`: `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedQueryObserverResult`](../type-aliases/DefinedQueryObserverResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<...\>\[`"data"`\], [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<...\[...\], ...\[...\]\>, [`DefinedQueryObserverResult`](../type-aliases/DefinedQueryObserverResult.md)\<...\[...\], ...\[...\]\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<...\>\[`"data"`\], [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<...\[...\], ...\[...\]\>, [`DefinedQueryObserverResult`](../type-aliases/DefinedQueryObserverResult.md)\<...\[...\], ...\[...\]\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...(...)[]`\] *extends* \[...\] ? \[..., ..., ...\] : ... *extends* ... ? ... : ... : \[...\{ \[K in (...) \| (...) \| (...)\]: GenericGetDefinedOrUndefinedQueryResult\<(...), (...), (...), (...)\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<T\[K\], InferDataAndError\<T\[K\]\>\["data"\], QueryObserverResult\<InferDataAndError\<(...)\[(...)\]\>\["data"\], InferDataAndError\<(...)\[(...)\]\>\["error"\]\>, DefinedQueryObserverResult\<InferDataAndError\<(...)\[(...)\]\>\["data"\], InferDataAndError\<(...)\[(...)\]\>\["error"\]\>\> \}) => `TCombinedResult` | Projects the current plain observer results into a single reactively computed value. |
| <a id="property-queries"></a> `queries` | \| readonly \[\{ \[K in string \| number \| symbol\]: GetCreateQueryOptionsForCreateQueries\<T\[K\]\> \}\] \| readonly \[`T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetCreateQueryOptionsForCreateQueries`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetCreateQueryOptionsForCreateQueries`\<`Head`\>, `GetCreateQueryOptionsForCreateQueries`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...(...)[]`\] *extends* \[...\] ? \[..., ..., ...\] : ... *extends* ... ? ... : ... : readonly `unknown`[] *extends* \[`...Tails[]`\] ? \[`...Tails[]`\] : \[`...(...)[]`\] *extends* ...[] ? ...[] : ...[] : readonly `unknown`[] *extends* `T` ? `T` : `T` *extends* `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] ? `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] : `QueryObserverOptionsForCreateQueries`\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]\] | The ordered query options to observe; entries can be added, removed, or replaced reactively. |
