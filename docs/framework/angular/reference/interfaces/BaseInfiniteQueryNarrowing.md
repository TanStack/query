---
id: BaseInfiniteQueryNarrowing
title: BaseInfiniteQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:138](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L138)

Signal-backed guards that narrow a paginated query result by its current status.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-iserror"></a> `isError` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"error", TData, TError>>`\> | Returns whether the result failed and narrows its data and error signals. |
| <a id="property-ispending"></a> `isPending` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"pending", TData, TError>>`\> | Narrows the result to the pending state when that state is possible. |
| <a id="property-issuccess"></a> `isSuccess` | `SignalFunction`\<(`this`: [`CreateInfiniteQueryResult`](../type-aliases/CreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"success", TData, TError>>`\> | Returns whether the result is successful and narrows its data and error signals. |
