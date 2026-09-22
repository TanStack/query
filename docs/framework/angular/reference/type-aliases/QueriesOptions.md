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

### TResults

`TResults` *extends* `any`[] = \[\]

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]
