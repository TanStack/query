---
id: InjectQueriesOptions
title: InjectQueriesOptions
---

Defined in: [packages/angular-query/src/inject-queries.types.ts:213](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-queries.types.ts#L213)

## Type Parameters

### T

`T` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = [`QueriesResults`](../type-aliases/QueriesResults.md)\<`T`\>

## Properties

### combine()?

```ts
optional combine: (result) => TCombinedResult;
```

Defined in: [packages/angular-query/src/inject-queries.types.ts:222](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-queries.types.ts#L222)

#### Parameters

##### result

`T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], `QueryObserverResult`\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, `DefinedQueryObserverResult`\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<...\>\[`"data"`\], `QueryObserverResult`\<...\[...\], ...\[...\]\>, `DefinedQueryObserverResult`\<...\[...\], ...\[...\]\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<...\>\[`"data"`\], `QueryObserverResult`\<...\[...\], ...\[...\]\>, `DefinedQueryObserverResult`\<...\[...\], ...\[...\]\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...(...)[]`\] *extends* \[...\] ? \[..., ..., ...\] : ... *extends* ... ? ... : ... : \[...\{ \[K in (...) \| (...) \| (...)\]: GenericGetDefinedOrUndefinedQueryResult\<(...), (...), (...), (...)\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<T\[K\<K\>\], InferDataAndError\<T\[K\<(...)\>\]\>\["data"\], QueryObserverResult\<InferDataAndError\<(...)\[(...)\]\>\["data"\], InferDataAndError\<(...)\[(...)\]\>\["error"\]\>, DefinedQueryObserverResult\<InferDataAndError\<(...)\[(...)\]\>\["data"\], InferDataAndError\<(...)\[(...)\]\>\["error"\]\>\> \}

#### Returns

`TCombinedResult`

***

### queries

```ts
queries:
  | readonly [{ [K in string | number | symbol]: GetCreateQueryOptionsForCreateQueries<T[K<K>]> }]
  | readonly [T extends [] ? [] : T extends [Head] ? [GetCreateQueryOptionsForCreateQueries<Head>] : T extends [Head, ...Tails[]] ? [...Tails[]] extends [] ? [] : [...Tails[]] extends [Head] ? [GetCreateQueryOptionsForCreateQueries<Head>, GetCreateQueryOptionsForCreateQueries<Head>] : [...Tails[]] extends [Head, ...Tails[]] ? [...Tails[]] extends [] ? [] : [...(...)[]] extends [...] ? [..., ..., ...] : ... extends ... ? ... : ... : readonly unknown[] extends [...Tails[]] ? [...Tails[]] : [...(...)[]] extends ...[] ? ...[] : ...[] : readonly unknown[] extends T ? T : T extends QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : QueryObserverOptionsForCreateQueries<unknown, Error, unknown, readonly unknown[]>[]];
```

Defined in: [packages/angular-query/src/inject-queries.types.ts:217](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-queries.types.ts#L217)
