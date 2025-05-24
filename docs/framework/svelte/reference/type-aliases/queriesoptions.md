---
id: QueriesOptions
title: QueriesOptions
---

# Type Alias: QueriesOptions\<T, TResults, TDepth\>

```ts
type QueriesOptions<T, TResults, TDepth> =
  TDepth['length'] extends MAXIMUM_DEPTH
    ? QueryObserverOptionsForCreateQueries[]
    : T extends []
      ? []
      : T extends [infer Head]
        ? [...TResults, GetQueryObserverOptionsForCreateQueries<Head>]
        : T extends [infer Head, ...infer Tails]
          ? QueriesOptions<
              [...Tails],
              [...TResults, GetQueryObserverOptionsForCreateQueries<Head>],
              [...TDepth, 1]
            >
          : ReadonlyArray<unknown> extends T
            ? T
            : T extends QueryObserverOptionsForCreateQueries<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >[]
              ? QueryObserverOptionsForCreateQueries<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >[]
              : QueryObserverOptionsForCreateQueries[]
```

QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param

## Type Parameters

• **T** _extends_ `any`[]

• **TResults** _extends_ `any`[] = []

• **TDepth** _extends_ `ReadonlyArray`\<`number`\> = []

## Defined in

[packages/svelte-query/src/createQueries.ts:129](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQueries.ts#L129)
