---
id: createQueries
title: createQueries
---

# Function: createQueries()

```ts
function createQueries<T, TCombinedResult>(
  __namedParameters,
  queryClient?,
): Readable<TCombinedResult>
```

## Type Parameters

• **T** _extends_ `any`[]

• **TCombinedResult** = `T` _extends_ [] ? [] : `T` _extends_ [`Head`] ? [`GetResults`\<`Head`\>] : `T` _extends_ [`Head`, `...Tail[]`] ? [`...Tail[]`] _extends_ [] ? [] : [`...Tail[]`] _extends_ [`Head`] ? [`GetResults`\<`Head`\>, `GetResults`\<`Head`\>] : [`...Tail[]`] _extends_ [`Head`, `...Tail[]`] ? [`...Tail[]`] _extends_ [] ? [] : [`...Tail[]`] _extends_ [`Head`] ? [`GetResults`\<`Head`\>, `GetResults`\<`Head`\>, `GetResults`\<`Head`\>] : [`...Tail[]`] _extends_ [`Head`, `...Tail[]`] ? [`...(...)[]`] _extends_ [] ? [] : ... _extends_ ... ? ... : ... : [`...(...)[]`] _extends_ ...[] ? ...[] : ...[] : [`...Tail[]`] _extends_ `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `any`\>[] ? `QueryObserverResult`\<`unknown` _extends_ `TData` ? `TQueryFnData` : `TData`, `unknown` _extends_ `TError` ? `Error` : `TError`\>[] : `QueryObserverResult`[] : `T` _extends_ `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `any`\>[] ? `QueryObserverResult`\<`unknown` _extends_ `TData` ? `TQueryFnData` : `TData`, `unknown` _extends_ `TError` ? `Error` : `TError`\>[] : `QueryObserverResult`[]

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.combine?**

• **\_\_namedParameters.queries?**: [`StoreOrVal`](storeorval.md)\<[`...(T extends [] ? [] : T extends [Head] ? [GetOptions<Head>] : T extends [Head, ...Tail[]] ? [...Tail[]] extends [] ? [] : [...Tail[]] extends [Head] ? [GetOptions<Head>, GetOptions<Head>] : [...Tail[]] extends [Head, ...Tail[]] ? [...(...)[]] extends [] ? [] : (...) extends (...) ? (...) : (...) : readonly (...)[] extends [...(...)[]] ? [...(...)[]] : (...) extends (...) ? (...) : (...) : readonly unknown[] extends T ? T : T extends QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : QueryObserverOptionsForCreateQueries<unknown, Error, unknown, QueryKey>[])[]`]\>

• **queryClient?**: `QueryClient`

## Returns

`Readable`\<`TCombinedResult`\>

## Defined in

[packages/svelte-query/src/createQueries.ts:186](https://github.com/TanStack/query/blob/13817e953743537ffb9aab4da174583055be4d81/packages/svelte-query/src/createQueries.ts#L186)
