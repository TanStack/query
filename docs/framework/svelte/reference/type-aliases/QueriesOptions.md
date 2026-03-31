---
id: QueriesOptions
title: QueriesOptions
---

# Type Alias: QueriesOptions\<T, TResults, TDepth\>

```ts
type QueriesOptions<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? CreateQueryOptionsForCreateQueries[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetCreateQueryOptionsForCreateQueries<Head>] : T extends [infer Head, ...(infer Tails)] ? QueriesOptions<[...Tails], [...TResults, GetCreateQueryOptionsForCreateQueries<Head>], [...TDepth, 1]> : ReadonlyArray<unknown> extends T ? T : T extends CreateQueryOptionsForCreateQueries<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>[] ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : CreateQueryOptionsForCreateQueries[];
```

Defined in: [packages/svelte-query/src/createQueries.svelte.ts:129](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQueries.svelte.ts#L129)

QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param

## Type Parameters

### T

`T` *extends* `any`[]

### TResults

`TResults` *extends* `any`[] = \[\]

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]
