---
id: QueriesResults
title: QueriesResults
---

# Type Alias: QueriesResults\<T, TResult, TDepth\>

```ts
type QueriesResults<T, TResult, TDepth>: TDepth["length"] extends MAXIMUM_DEPTH ? QueryObserverResult[] : T extends [] ? [] : T extends [infer Head] ? [...TResult, GetResults<Head>] : T extends [infer Head, ...(infer Tail)] ? QueriesResults<[...Tail], [...TResult, GetResults<Head>], [...TDepth, 1]> : T extends QueryObserverOptionsForCreateQueries<infer TQueryFnData, infer TError, infer TData, any>[] ? QueryObserverResult<unknown extends TData ? TQueryFnData : TData, unknown extends TError ? DefaultError : TError>[] : QueryObserverResult[];
```

QueriesResults reducer recursively maps type param to results

## Type Parameters

• **T** _extends_ `any`[]

• **TResult** _extends_ `any`[] = []

• **TDepth** _extends_ `ReadonlyArray`\<`number`\> = []

## Defined in

[inject-queries.ts:151](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/inject-queries.ts#L151)
