---
id: BaseQueryNarrowing
title: BaseQueryNarrowing
---

Defined in: [packages/angular-query-experimental/src/types.ts:80](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L80)

The `isSuccess`/`isError`/`isPending` methods on a query result. Unlike `react-query`'s derived booleans,
these are type-guard methods you call — `if (query.isSuccess())` — so that `query.data` narrows away
`undefined` inside the branch, the same way `status` narrowing works on the plain object `react-query`
returns.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The type of errors your `queryFn` may throw.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="iserror"></a> `isError` | (`this`: [`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>) => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>` | Returns `true` if the query is in the `error` state, narrowing the result to that state. |
| <a id="ispending"></a> `isPending` | (`this`: [`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>) => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>` | Returns `true` if the query is in the `pending` state, narrowing the result to that state. |
| <a id="issuccess"></a> `isSuccess` | (`this`: [`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>) => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>` | Returns `true` if the query is in the `success` state, narrowing the result to that state. |
