---
id: injectQueries
title: injectQueries
---

# Function: injectQueries()

```ts
function injectQueries<T, TCombinedResult>(optionsFn, injector?): Signal<TCombinedResult>;
```

Defined in: [inject-queries.ts:278](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-queries.ts#L278)

## Type Parameters

### T

`T` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<Tails\[K\<(...)\>\], InferDataAndError\<(...)\>\["data"\], CreateQueryResult\<(...)\[(...)\], (...)\[(...)\]\>, DefinedCreateQueryResult\<(...)\[(...)\], (...)\[(...)\]\>\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<T\[K\<K\>\], InferDataAndError\<T\[K\<K\>\]\>\["data"\], CreateQueryResult\<InferDataAndError\<T\[K\<K\>\]\>\["data"\], InferDataAndError\<T\[K\<K\>\]\>\["error"\]\>, DefinedCreateQueryResult\<InferDataAndError\<T\[K\<K\>\]\>\["data"\], InferDataAndError\<T\[K\<K\>\]\>\["error"\]\>\> \}

## Parameters

### optionsFn

() => [`InjectQueriesOptions`](../interfaces/InjectQueriesOptions.md)\<`T`, `TCombinedResult`\>

A function that returns queries' options.

### injector?

`Injector`

The Angular injector to use.

## Returns

`Signal`\<`TCombinedResult`\>
