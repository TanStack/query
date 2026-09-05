---
id: QueriesResults
title: QueriesResults
---

```ts
type QueriesResults<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? CreateQueryResult[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetCreateQueryResult<Head>] : T extends [infer Head, ...(infer Tails)] ? QueriesResults<[...Tails], [...TResults, GetCreateQueryResult<Head>], [...TDepth, 1]> : { [K in keyof T]: GetCreateQueryResult<T[K]> };
```

Defined in: [inject-queries.ts:205](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-queries.ts#L205)

The result type returned by `injectQueries`, when no `combine` is provided. Mirrors [QueriesOptions](QueriesOptions.md):
each tuple element's result type is inferred individually, up to 20 elements — past that, tuple recursion
falls back to a single homogeneous [CreateQueryResult](CreateQueryResult.md) type. A non-tuple array is mapped per-element
instead, with no such limit — every entry keeps its individually inferred type regardless of array length.

## Type Parameters

### T

`T` *extends* `any`[]

The type of the `queries` array, as inferred by [QueriesOptions](QueriesOptions.md).

### TResults

`TResults` *extends* `any`[] = \[\]

The internal accumulator that this type builds during recursion. It is not meant to
be set explicitly.

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]

The internal recursion-depth counter, checked against the 20-element limit. It is not
meant to be set explicitly.
