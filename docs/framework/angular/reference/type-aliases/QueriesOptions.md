---
id: QueriesOptions
title: QueriesOptions
---

```ts
type QueriesOptions<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? QueryObserverOptionsForCreateQueries[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetCreateQueryOptionsForCreateQueries<Head>] : T extends [infer Head, ...(infer Tails)] ? QueriesOptions<[...Tails], [...TResults, GetCreateQueryOptionsForCreateQueries<Head>], [...TDepth, 1]> : ReadonlyArray<unknown> extends T ? T : T extends QueryObserverOptionsForCreateQueries<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>[] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : QueryObserverOptionsForCreateQueries[];
```

Defined in: [inject-queries.ts:154](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-queries.ts#L154)

The `queries` array accepted by `injectQueries`. Recursively unwraps each tuple element so every entry's
`queryFn`/`select`/`throwOnError` are inferred individually, up to 20 elements — past that, tuple
recursion falls back to a single homogeneous options type. An opaque array (e.g. `unknown[]`) is returned
as-is; a non-tuple array of a known element type is mapped to that element type instead, with no such
limit.

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
