---
id: SuspenseQueriesResults
title: SuspenseQueriesResults
---

```ts
type SuspenseQueriesResults<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? UseSuspenseQueryResult[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetUseSuspenseQueryResult<Head>] : T extends [infer Head, ...(infer Tails)] ? SuspenseQueriesResults<[...Tails], [...TResults, GetUseSuspenseQueryResult<Head>], [...TDepth, 1]> : { [K in keyof T]: GetUseSuspenseQueryResult<T[K]> };
```

Defined in: [packages/preact-query/src/useSuspenseQueries.ts:165](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseQueries.ts#L165)

The result type returned by `useSuspenseQueries`, when no `combine` is provided. Mirrors
[SuspenseQueriesOptions](SuspenseQueriesOptions.md): each tuple element's result type is inferred individually, up to 20 elements.
A non-tuple array is mapped per-element instead, still inferring each entry individually; only past 20
elements does this fall back to a single homogeneous [UseSuspenseQueryResult](UseSuspenseQueryResult.md) type.

## Type Parameters

### T

`T` *extends* `any`[]

The type of the `queries` array, as inferred by [SuspenseQueriesOptions](SuspenseQueriesOptions.md).

### TResults

`TResults` *extends* `any`[] = \[\]

The internal accumulator that this type builds during recursion. It is not meant
to be set explicitly.

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]

The internal recursion-depth counter, checked against the 20-element limit. It is not
meant to be set explicitly.
