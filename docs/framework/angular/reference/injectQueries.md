---
id: injectQueries
title: injectQueries
---

# Function: injectQueries()

```ts
function injectQueries<T, TCombinedResult>(
  __namedParameters,
  injector?,
): Signal<TCombinedResult>
```

## Type Parameters

• **T** _extends_ `any`[]

• **TCombinedResult** = `T` _extends_ [] ? [] : `T` _extends_ [`Head`] ? [`GetResults`\<`Head`\>] : `T` _extends_ [`Head`, `...Tail[]`] ? [`...Tail[]`] _extends_ [] ? [] : [`...Tail[]`] _extends_ [`Head`] ? [`GetResults`\<`Head`\>, `GetResults`\<`Head`\>] : [`...Tail[]`] _extends_ [`Head`, `...Tail[]`] ? [`...Tail[]`] _extends_ [] ? [] : [`...Tail[]`] _extends_ [`Head`] ? [`GetResults`\<`Head`\>, `GetResults`\<`Head`\>, `GetResults`\<`Head`\>] : [`...Tail[]`] _extends_ [`Head`, `...Tail[]`] ? [`...(...)[]`] _extends_ [] ? [] : ... _extends_ ... ? ... : ... : [`...(...)[]`] _extends_ ...[] ? ...[] : ...[] : [`...Tail[]`] _extends_ `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `any`\>[] ? `QueryObserverResult`\<`unknown` _extends_ `TData` ? `TQueryFnData` : `TData`, `unknown` _extends_ `TError` ? `Error` : `TError`\>[] : `QueryObserverResult`[] : `T` _extends_ `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `any`\>[] ? `QueryObserverResult`\<`unknown` _extends_ `TData` ? `TQueryFnData` : `TData`, `unknown` _extends_ `TError` ? `Error` : `TError`\>[] : `QueryObserverResult`[]

## Parameters

• **\_\_namedParameters**

• **\_\_namedParameters.combine?**

• **\_\_namedParameters.queries?**: `Signal`\<[`...(T extends [] ? [] : T extends [Head] ? [GetOptions<Head>] : T extends [Head, ...Tail[]] ? [...Tail[]] extends [] ? [] : [...Tail[]] extends [Head] ? [GetOptions<Head>, GetOptions<Head>] : [...Tail[]] extends [Head, ...Tail[]] ? [...(...)[]] extends [] ? [] : (...) extends (...) ? (...) : (...) : readonly (...)[] extends [...(...)[]] ? [...(...)[]] : (...) extends (...) ? (...) : (...) : readonly unknown[] extends T ? T : T extends QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : QueryObserverOptionsForCreateQueries<unknown, Error, unknown, QueryKey>[])[]`]\>

• **injector?**: `Injector`

## Returns

`Signal`\<`TCombinedResult`\>

## Defined in

[inject-queries.ts:188](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/inject-queries.ts#L188)
