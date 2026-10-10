---
id: UseQueriesResults
title: UseQueriesResults
---

```ts
type UseQueriesResults<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? QueryObserverResult[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetUseQueryResult<Head>] : T extends [infer Head, ...(infer Tails)] ? UseQueriesResults<[...Tails], [...TResults, GetUseQueryResult<Head>], [...TDepth, 1]> : { [K in keyof T]: GetUseQueryResult<T[K]> };
```

Defined in: [packages/vue-query/src/useQueries.ts:212](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQueries.ts#L212)

UseQueriesResults reducer recursively maps type param to results

## Type Parameters

### T

`T` *extends* `any`[]

### TResults

`TResults` *extends* `any`[] = \[\]

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]
