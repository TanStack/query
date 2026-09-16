---
id: QueriesResults
title: QueriesResults
---

```ts
type QueriesResults<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? CreateQueryResult[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetCreateQueryResult<Head>] : T extends [infer Head, ...(infer Tails)] ? QueriesResults<[...Tails], [...TResults, GetCreateQueryResult<Head>], [...TDepth, 1]> : { [K in keyof T]: GetCreateQueryResult<T[K]> };
```

Defined in: [packages/angular-query/src/inject-queries.types.ts:177](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-queries.types.ts#L177)

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
