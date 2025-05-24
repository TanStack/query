---
id: injectQueries
title: injectQueries
---

# Function: injectQueries()

```ts
function injectQueries<T, TCombinedResult>(__namedParameters, injector?): Signal<TCombinedResult>
```

## Type Parameters

• **T** *extends* `any`[]

• **TCombinedResult** = `T` *extends* [] ? [] : `T` *extends* [`Head`] ? [`GetResults`\<`Head`\>] : `T` *extends* [`Head`, `...Tail[]`] ? [`...Tail[]`] *extends* [] ? [] : [`...Tail[]`] *extends* [`Head`] ? [`GetResults`\<`Head`\>, `GetResults`\<`Head`\>] : [`...Tail[]`] *extends* [`Head`, `...Tail[]`] ? [`...Tail[]`] *extends* [] ? [] : [`...Tail[]`] *extends* [`Head`] ? [`GetResults`\<`Head`\>, `GetResults`\<`Head`\>, `GetResults`\<`Head`\>] : [`...Tail[]`] *extends* [`Head`, `...Tail[]`] ? [`...(...)[]`] *extends* [] ? [] : ... *extends* ... ? ... : ... : [`...(...)[]`] *extends* ...[] ? ...[] : ...[] : [`...Tail[]`] *extends* `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `any`\>[] ? `QueryObserverResult`\<`unknown` *extends* `TData` ? `TQueryFnData` : `TData`, `unknown` *extends* `TError` ? `Error` : `TError`\>[] : `QueryObserverResult`[] : `T` *extends* `QueryObserverOptionsForCreateQueries`\<`TQueryFnData`, `TError`, `TData`, `any`\>[] ? `QueryObserverResult`\<`unknown` *extends* `TData` ? `TQueryFnData` : `TData`, `unknown` *extends* `TError` ? `Error` : `TError`\>[] : `QueryObserverResult`[]

## Parameters

### \_\_namedParameters

#### combine

(`result`) => `TCombinedResult`

#### queries

`Signal`\<[`...(T extends [] ? [] : T extends [Head] ? [GetOptions<Head>] : T extends [Head, ...Tail[]] ? [...Tail[]] extends [] ? [] : [...Tail[]] extends [Head] ? [GetOptions<Head>, GetOptions<Head>] : [...Tail[]] extends [Head, ...Tail[]] ? [...(...)[]] extends [] ? [] : (...) extends (...) ? (...) : (...) : readonly (...)[] extends [...(...)[]] ? [...(...)[]] : (...) extends (...) ? (...) : (...) : readonly unknown[] extends T ? T : T extends QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>[] : QueryObserverOptionsForCreateQueries<unknown, Error, unknown, readonly (...)[]>[])[]`]\>

### injector?

`Injector`

## Returns

`Signal`\<`TCombinedResult`\>

## Defined in

[inject-queries.ts:206](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-queries.ts#L206)
