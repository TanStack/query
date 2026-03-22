---
id: QueriesResults
title: QueriesResults
---

# Type Alias: QueriesResults\<T, TResults, TDepth\>

```ts
type QueriesResults<T, TResults, TDepth> = TDepth["length"] extends MAXIMUM_DEPTH ? UseQueryResult[] : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetUseQueryResult<Head>] : T extends [infer Head, ...(infer Tails)] ? QueriesResults<[...Tails], [...TResults, GetUseQueryResult<Head>], [...TDepth, 1]> : { [K in keyof T]: GetUseQueryResult<T[K]> };
```

Defined in: [preact-query/src/useQueries.ts:189](https://github.com/theVedanta/query/blob/main/packages/preact-query/src/useQueries.ts#L189)

QueriesResults reducer recursively maps type param to results

## Type Parameters

### T

`T` *extends* `any`[]

### TResults

`TResults` *extends* `any`[] = \[\]

### TDepth

`TDepth` *extends* `ReadonlyArray`\<`number`\> = \[\]
