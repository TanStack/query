---
id: QueriesResults
title: QueriesResults
---

# Type Alias: QueriesResults\<T, TResults, TDepth\>

```ts
type QueriesResults<T, TResults, TDepth> =
  TDepth['length'] extends MAXIMUM_DEPTH
    ? QueryObserverResult[]
    : T extends []
      ? []
      : T extends [infer Head]
        ? [...TResults, GetCreateQueryResult<Head>]
        : T extends [infer Head, ...infer Tails]
          ? QueriesResults<
              [...Tails],
              [...TResults, GetCreateQueryResult<Head>],
              [...TDepth, 1]
            >
          : T extends QueryObserverOptionsForCreateQueries<
                infer TQueryFnData,
                infer TError,
                infer TData,
                any
              >[]
            ? QueryObserverResult<
                unknown extends TData ? TQueryFnData : TData,
                unknown extends TError ? DefaultError : TError
              >[]
            : QueryObserverResult[]
```

QueriesResults reducer recursively maps type param to results

## Type Parameters

• **T** _extends_ `any`[]

• **TResults** _extends_ `any`[] = []

• **TDepth** _extends_ `ReadonlyArray`\<`number`\> = []

## Defined in

[packages/svelte-query/src/createQueries.ts:171](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQueries.ts#L171)
