---
id: injectQueries
title: injectQueries
---

```ts
function injectQueries<T, TCombinedResult>(optionsFn: () => InjectQueriesOptions<T, TCombinedResult>): Signal<TCombinedResult>;
```

Defined in: packages/angular-query/src/inject-queries.ts:55

Injects multiple queries that run in parallel and react to Angular signals.

## Type Parameters

### T

`T` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<Tails\[K\], InferDataAndError\<(...)\>\["data"\], CreateQueryResult\<(...)\[(...)\], (...)\[(...)\]\>, DefinedCreateQueryResult\<(...)\[(...)\], (...)\[(...)\]\>\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<T\[K\], InferDataAndError\<T\[K\]\>\["data"\], CreateQueryResult\<InferDataAndError\<T\[K\]\>\["data"\], InferDataAndError\<T\[K\]\>\["error"\]\>, DefinedCreateQueryResult\<InferDataAndError\<T\[K\]\>\["data"\], InferDataAndError\<T\[K\]\>\["error"\]\>\> \}

## Parameters

### optionsFn

() => [`InjectQueriesOptions`](../interfaces/InjectQueriesOptions.md)\<`T`, `TCombinedResult`\>

A function that returns the queries' options. Similar to `computed` from Angular,
this function runs in the reactive context, so signals read inside it drive the queries.

<a id="optionsFn-properties"></a>

#### `optionsFn` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="optionsFn-property-combine"></a> `combine?` | (`result`: `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedQueryObserverResult`](../type-aliases/DefinedQueryObserverResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<...\>\[`"data"`\], [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<...\[...\], ...\[...\]\>, [`DefinedQueryObserverResult`](../type-aliases/DefinedQueryObserverResult.md)\<...\[...\], ...\[...\]\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<...\>\[`"data"`\], [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)\<...\[...\], ...\[...\]\>, [`DefinedQueryObserverResult`](../type-aliases/DefinedQueryObserverResult.md)\<...\[...\], ...\[...\]\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...(...)[]`\] *extends* \[...\] ? \[..., ..., ...\] : ... *extends* ... ? ... : ... : \[...\{ \[K in (...) \| (...) \| (...)\]: GenericGetDefinedOrUndefinedQueryResult\<(...), (...), (...), (...)\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<T\[K\], InferDataAndError\<T\[K\]\>\["data"\], QueryObserverResult\<InferDataAndError\<(...)\[(...)\]\>\["data"\], InferDataAndError\<(...)\[(...)\]\>\["error"\]\>, DefinedQueryObserverResult\<InferDataAndError\<(...)\[(...)\]\>\["data"\], InferDataAndError\<(...)\[(...)\]\>\["error"\]\>\> \}) => `TCombinedResult` | Projects the current plain observer results into a single reactively computed value. |
| <a id="optionsFn-property-queries"></a> `queries` | \| readonly \[\{ \[K in string \| number \| symbol\]: GetCreateQueryOptionsForCreateQueries\<T\[K\]\> \}\] \| readonly \[`T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GetCreateQueryOptionsForCreateQueries`\<`Head`\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GetCreateQueryOptionsForCreateQueries`\<`Head`\>, `GetCreateQueryOptionsForCreateQueries`\<`Head`\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...(...)[]`\] *extends* \[...\] ? \[..., ..., ...\] : ... *extends* ... ? ... : ... : readonly `unknown`[] *extends* \[`...Tails[]`\] ? \[`...Tails[]`\] : \[`...(...)[]`\] *extends* ...[] ? ...[] : ...[] : readonly `unknown`[] *extends* `T` ? `T` : `T` *extends* `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] ? `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `TQueryKey`\>[] : `QueryObserverOptionsForCreateQueries`\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]\] | The ordered query options to observe; entries can be added, removed, or replaced reactively. |

## Returns

`Signal`\<`TCombinedResult`\>

A signal containing the query results in the same order as the input queries.

## See

https://tanstack.com/query/latest/docs/framework/angular/guides/parallel-queries

## Example

```angular-ts
@Component({
  selector: 'users',
  template: `
    @for (query of userQueries(); track $index) {
      @if (query.isSuccess()) {
        <p>{{ query.data().name }}</p>
      }
    }
  `,
})
export class UsersComponent {
  readonly users = input.required<Array<User>>()

  readonly userQueries = injectQueries(() => ({
    queries: this.users().map((user) => ({
      queryKey: ['user', user.id],
      queryFn: () => fetchUserById(user.id),
    })),
  }))
}
```
