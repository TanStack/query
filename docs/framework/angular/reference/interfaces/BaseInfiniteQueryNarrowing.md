---
id: BaseInfiniteQueryNarrowing
title: BaseInfiniteQueryNarrowing
---

Defined in: packages/angular-query/src/types.ts:107

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-iserror"></a> `isError` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"error", TData, TError>>`\> |
| <a id="property-ispending"></a> `isPending` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"pending", TData, TError>>`\> |
| <a id="property-issuccess"></a> `isSuccess` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"success", TData, TError>>`\> |
