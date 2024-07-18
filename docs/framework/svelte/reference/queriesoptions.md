---
id: QueriesOptions
title: QueriesOptions
---

# Type Alias: QueriesOptions\<T, TResult, TDepth\>

```ts
type QueriesOptions<T, TResult, TDepth>: TDepth["length"] extends MAXIMUM_DEPTH ? QueryObserverOptionsForCreateQueries[] : T extends [] ? [] : T extends [infer Head] ? [...TResult, GetOptions<Head>] : T extends [infer Head, ...(infer Tail)] ? QueriesOptions<[...Tail], [...TResult, GetOptions<Head>], [...TDepth, 1]> : ReadonlyArray<unknown> extends T ? T : T extends QueryObserverOptionsForCreateQueries<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>[] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : QueryObserverOptionsForCreateQueries[];
```

QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param

## Type Parameters

• **T** _extends_ `any`[]

• **TResult** _extends_ `any`[] = []

• **TDepth** _extends_ `ReadonlyArray`\<`number`\> = []

## Defined in

[packages/svelte-query/src/createQueries.ts:110](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/createQueries.ts#L110)
