---
id: injectQueries
title: injectQueries
---

```ts
function injectQueries<T, TCombinedResult>(optionsFn: () => InjectQueriesOptions<T, TCombinedResult>): Signal<TCombinedResult>;
```

Defined in: [packages/angular-query/src/inject-queries.ts:57](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-queries.ts#L57)

Injects multiple queries that run in parallel and react to Angular signals.

## Type Parameters

### T

`T` *extends* `any`[]

### TCombinedResult

`TCombinedResult` = `T` *extends* \[\] ? \[\] : `T` *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : `T` *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, `InferDataAndError`\<`Head`\>\[`"data"`\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`InferDataAndError`\<`Head`\>\[`"data"`\], `InferDataAndError`\<`Head`\>\[`"error"`\]\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...Tails[]`\] *extends* \[\] ? \[\] : \[`...Tails[]`\] *extends* \[`Head`\] ? \[`GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>, `GenericGetDefinedOrUndefinedQueryResult`\<`Head`, ...\[...\], [`CreateQueryResult`](../type-aliases/CreateQueryResult.md)\<..., ...\>, [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<..., ...\>\>\] : \[`...Tails[]`\] *extends* \[`Head`, `...Tails[]`\] ? \[`...(...)[]`\] *extends* \[\] ? \[\] : ... *extends* ... ? ... : ... : \[`...{ [K in (...)]: (...) }[]`\] : \[...\{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<Tails\[K\<(...)\>\], InferDataAndError\<(...)\>\["data"\], CreateQueryResult\<(...)\[(...)\], (...)\[(...)\]\>, DefinedCreateQueryResult\<(...)\[(...)\], (...)\[(...)\]\>\> \}\[\]\] : \{ \[K in string \| number \| symbol\]: GenericGetDefinedOrUndefinedQueryResult\<T\[K\<K\>\], InferDataAndError\<T\[K\<K\>\]\>\["data"\], CreateQueryResult\<InferDataAndError\<T\[K\<K\>\]\>\["data"\], InferDataAndError\<T\[K\<K\>\]\>\["error"\]\>, DefinedCreateQueryResult\<InferDataAndError\<T\[K\<K\>\]\>\["data"\], InferDataAndError\<T\[K\<K\>\]\>\["error"\]\>\> \}

## Parameters

### optionsFn

() => [`InjectQueriesOptions`](../interfaces/InjectQueriesOptions.md)\<`T`, `TCombinedResult`\>

A function that returns the queries' options. Similar to `computed` from Angular,
this function runs in the reactive context, so signals read inside it drive the queries.

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
