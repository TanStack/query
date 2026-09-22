---
id: BaseInfiniteQueryNarrowing
title: BaseInfiniteQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:119](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L119)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="iserror"></a> `isError` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"error", TData, TError>>`\> |
| <a id="ispending"></a> `isPending` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"pending", TData, TError>>`\> |
| <a id="issuccess"></a> `isSuccess` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"success", TData, TError>>`\> |
