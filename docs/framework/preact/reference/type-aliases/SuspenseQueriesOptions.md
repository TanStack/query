---
id: SuspenseQueriesOptions
title: SuspenseQueriesOptions
---

```ts
type SuspenseQueriesOptions<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? UseSuspenseQueryOptions[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetUseSuspenseQueryOptions<Head>] : T extends [infer Head, ...(infer Tails)] ? SuspenseQueriesOptions<[...Tails], [...TResults, GetUseSuspenseQueryOptions<Head>], [...TDepth, 1]> : unknown[] extends T ? T : T extends UseSuspenseQueryOptions<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>[] ? UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>[] : UseSuspenseQueryOptions[];
```

Defined in: [preact-query/src/useSuspenseQueries.ts:119](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useSuspenseQueries.ts#L119)

The `queries` array accepted by `useSuspenseQueries`. Recursively unwraps each tuple element so every
entry's `queryFn`/`select` are inferred individually, up to 20 elements. An opaque array (e.g. `unknown[]`)
is returned as-is; a non-tuple array of a known element type, or a tuple past 20 elements, falls back to a
single homogeneous [UseSuspenseQueryOptions](../interfaces/UseSuspenseQueryOptions.md) type.

## Type Parameters

### T

`T` *extends* `any`[]

The type of the `queries` array as written at the call site.

### TResults

`TResults` *extends* `any`[] = \[\]

Internal accumulator this type builds up during recursion. Not meant to be set
explicitly.

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]

Internal recursion-depth counter, checked against the 20-element limit. Not meant to be
set explicitly.
