---
id: QueriesOptions
title: QueriesOptions
---

```ts
type QueriesOptions<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? UseQueryOptionsForUseQueries[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetUseQueryOptionsForUseQueries<Head>] : T extends [infer Head, ...(infer Tails)] ? QueriesOptions<[...Tails], [...TResults, GetUseQueryOptionsForUseQueries<Head>], [...TDepth, 1]> : ReadonlyArray<unknown> extends T ? T : T extends UseQueryOptionsForUseQueries<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>[] ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData, TQueryKey>[] : UseQueryOptionsForUseQueries[];
```

Defined in: [packages/react-query/src/useQueries.ts:156](https://github.com/TanStack/query/blob/main/packages/react-query/src/useQueries.ts#L156)

The `queries` array accepted by `useQueries`. Recursively unwraps each tuple element so every entry's
`queryFn`/`select`/`throwOnError` are inferred individually, up to 20 elements. An opaque array (e.g.
`unknown[]`) is returned as-is; a non-tuple array of a known element type, or a tuple past 20 elements, falls
back to a single homogeneous options type.

## Type Parameters

### T

`T` *extends* `any`[]

The type of the `queries` array as written at the call site.

### TResults

`TResults` *extends* `any`[] = \[\]

The internal accumulator that this type builds during recursion. It is not meant
to be set explicitly.

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]

The internal recursion-depth counter, checked against the 20-element limit. It is not
meant to be set explicitly.
