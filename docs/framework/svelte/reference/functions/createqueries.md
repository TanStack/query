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

• **TCombinedResult** = `T` _extends_ [] ? [] : `T` _extends_ [`Head`] ? [`GetCreateQueryResult`\<`Head`\>] : `T` _extends_ [`Head`, `...Tails[]`] ? [`...Tails[]`] _extends_ [] ? [] : [`...Tails[]`] _extends_ [`Head`] ? [`GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>] : [`...Tails[]`] _extends_ [`Head`, `...Tails[]`] ? [`...Tails[]`] _extends_ [] ? [] : [`...Tails[]`] _extends_ [`Head`] ? [`GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>] : [`...Tails[]`] _extends_ [`Head`, `...Tails[]`] ? [`...(...)[]`] _extends_ [] ? [] : ... _extends_ ... ? ... : ... : [`...(...)[]`] _extends_ ...[] ? ...[] : ...[] : [`...Tails[]`] _extends_ `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `any`\>[] ? `QueryObserverResult`\<`unknown` _extends_ `TData` ? `TQueryFnData` : `TData`, `unknown` _extends_ `TError` ? `Error` : `TError`\>[] : `QueryObserverResult`[] : `T` _extends_ `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `any`\>[] ? `QueryObserverResult`\<`unknown` _extends_ `TData` ? `TQueryFnData` : `TData`, `unknown` _extends_ `TError` ? `Error` : `TError`\>[] : `QueryObserverResult`[]

## Parameters

### \_\_namedParameters

#### combine

(`result`) => `TCombinedResult`

#### queries

[`StoreOrVal`](../type-aliases/storeorval.md)\<[`...(T extends [] ? [] : T extends [Head] ? [GetQueryObserverOptionsForCreateQueries<Head>] : T extends [Head, ...Tails[]] ? [...Tails[]] extends [] ? [] : [...Tails[]] extends [Head] ? [GetQueryObserverOptionsForCreateQueries<Head>, GetQueryObserverOptionsForCreateQueries<Head>] : [...Tails[]] extends [Head, ...Tails[]] ? [...(...)[]] extends [] ? [] : (...) extends (...) ? (...) : (...) : readonly (...)[] extends [...(...)[]] ? [...(...)[]] : (...) extends (...) ? (...) : (...) : readonly unknown[] extends T ? T : T extends QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : QueryObserverOptionsForCreateQueries<unknown, Error, unknown, readonly (...)[]>[])[]`]\>

### queryClient?

`QueryClient`

## Returns

`Readable`\<`TCombinedResult`\>

## Defined in

[packages/svelte-query/src/createQueries.ts:205](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQueries.ts#L205)
