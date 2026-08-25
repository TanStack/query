---
id: SuspenseQueriesResults
title: SuspenseQueriesResults
---

```ts
type SuspenseQueriesResults<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? UseSuspenseQueryResult[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetUseSuspenseQueryResult<Head>] : T extends [infer Head, ...(infer Tails)] ? SuspenseQueriesResults<[...Tails], [...TResults, GetUseSuspenseQueryResult<Head>], [...TDepth, 1]> : { [K in keyof T]: GetUseSuspenseQueryResult<T[K]> };
```

Defined in: [preact-query/src/useSuspenseQueries.ts:153](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseQueries.ts#L153)

The result type returned by `useSuspenseQueries`, when no `combine` is provided. Mirrors
[SuspenseQueriesOptions](SuspenseQueriesOptions.md): each tuple element's result type is inferred individually, up to 20 elements.
A non-tuple array is mapped per-element instead, still inferring each entry individually; only past 20
elements does this fall back to a single homogeneous [UseSuspenseQueryResult](UseSuspenseQueryResult.md) type.

## Type Parameters

### T

`T` *extends* `any`[]

### TResults

`TResults` *extends* `any`[] = \[\]

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]
