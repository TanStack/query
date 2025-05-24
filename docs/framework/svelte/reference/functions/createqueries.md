---
id: createQueries
title: createQueries
---

# Function: createQueries()

```ts
function createQueries<T, TCombinedResult>(__namedParameters, queryClient?): Readable<TCombinedResult>
```

## Type Parameters

• **T** *extends* `any`[]

• **TCombinedResult** = `T` *extends* [] ? [] : `T` *extends* [`Head`] ? [`GetCreateQueryResult`\<`Head`\>] : `T` *extends* [`Head`, `...Tails[]`] ? [`...Tails[]`] *extends* [] ? [] : [`...Tails[]`] *extends* [`Head`] ? [`GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>] : [`...Tails[]`] *extends* [`Head`, `...Tails[]`] ? [`...Tails[]`] *extends* [] ? [] : [`...Tails[]`] *extends* [`Head`] ? [`GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>, `GetCreateQueryResult`\<`Head`\>] : [`...Tails[]`] *extends* [`Head`, `...Tails[]`] ? [`...(...)[]`] *extends* [] ? [] : ... *extends* ... ? ... : ... : [`...{ [K in (...)]: (...) }[]`] : [...\{ \[K in string \| number \| symbol\]: GetCreateQueryResult\<Tails\[K\<(...)\>\]\> \}\[\]] : \{ \[K in string \| number \| symbol\]: GetCreateQueryResult\<T\[K\<K\>\]\> \}

## Parameters

### \_\_namedParameters

#### combine

(`result`) => `TCombinedResult`

#### queries

  \| [`StoreOrVal`](../../type-aliases/storeorval.md)\<[`...(T extends [] ? [] : T extends [Head] ? [GetQueryObserverOptionsForCreateQueries<Head>] : T extends [Head, ...Tails[]] ? [...Tails[]] extends [] ? [] : [...Tails[]] extends [Head] ? [GetQueryObserverOptionsForCreateQueries<(...)>, GetQueryObserverOptionsForCreateQueries<(...)>] : [...(...)[]] extends [(...), ...(...)[]] ? (...) extends (...) ? (...) : (...) : (...) extends (...) ? (...) : (...) : readonly unknown[] extends T ? T : T extends QueryObserverOptionsForCreateQueries<(...), (...), (...), (...)>[] ? QueryObserverOptionsForCreateQueries<(...), (...), (...), (...)>[] : QueryObserverOptionsForCreateQueries<(...), (...), (...), (...)>[])[]`]\>
  \| [`StoreOrVal`](../../type-aliases/storeorval.md)\<[...\{ \[K in string \| number \| symbol\]: GetQueryObserverOptionsForCreateQueries\<T\[K\<K\>\]\> \}\[\]]\>

### queryClient?

`QueryClient`

## Returns

`Readable`\<`TCombinedResult`\>

## Defined in

[packages/svelte-query/src/createQueries.ts:189](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/createQueries.ts#L189)
