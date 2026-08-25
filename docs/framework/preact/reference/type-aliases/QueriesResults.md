---
id: QueriesResults
title: QueriesResults
---

```ts
type QueriesResults<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? UseQueryResult[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetUseQueryResult<Head>] : T extends [infer Head, ...(infer Tails)] ? QueriesResults<[...Tails], [...TResults, GetUseQueryResult<Head>], [...TDepth, 1]> : { [K in keyof T]: GetUseQueryResult<T[K]> };
```

Defined in: [preact-query/src/useQueries.ts:195](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useQueries.ts#L195)

The result type returned by `useQueries`, when no `combine` is provided. Mirrors [QueriesOptions](QueriesOptions.md): each
tuple element's result type is inferred individually, up to 20 elements. A non-tuple array is mapped
per-element instead, still inferring each entry individually; only past 20 elements does this fall back to a
single homogeneous [UseQueryResult](UseQueryResult.md) type.

## Type Parameters

### T

`T` *extends* `any`[]

### TResults

`TResults` *extends* `any`[] = \[\]

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]
