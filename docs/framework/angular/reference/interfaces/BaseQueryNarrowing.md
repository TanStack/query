---
id: BaseQueryNarrowing
title: BaseQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:65](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L65)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="iserror"></a> `isError` | `SignalFunction`\<(`this`: [`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>) => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>`\> |
| <a id="ispending"></a> `isPending` | `SignalFunction`\<(`this`: [`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>) => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>`\> |
| <a id="issuccess"></a> `isSuccess` | `SignalFunction`\<(`this`: [`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>) => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>`\> |
