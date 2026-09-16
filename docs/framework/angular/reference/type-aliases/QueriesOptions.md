---
id: QueriesOptions
title: QueriesOptions
---

```ts
type QueriesOptions<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? QueryObserverOptionsForCreateQueries[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetCreateQueryOptionsForCreateQueries<Head>] : T extends [infer Head, ...(infer Tails)] ? QueriesOptions<[...Tails], [...TResults, GetCreateQueryOptionsForCreateQueries<Head>], [...TDepth, 1]> : ReadonlyArray<unknown> extends T ? T : T extends QueryObserverOptionsForCreateQueries<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>[] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : QueryObserverOptionsForCreateQueries[];
```

Defined in: [packages/angular-query/src/inject-queries.types.ts:141](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-queries.types.ts#L141)

## Type Parameters

### T

`T` *extends* `any`[]

The type of the `queries` array as written at the call site.

### TResults

`TResults` *extends* `any`[] = \[\]

The internal accumulator that this type builds during recursion. It is not meant to
be set explicitly.

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]

The internal recursion-depth counter, checked against the 20-element limit. It is not
meant to be set explicitly.
