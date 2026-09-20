---
id: DefinedInfiniteQueryNarrowing
title: DefinedInfiniteQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:152](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L152)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="iserror"></a> `isError` | `SignalFunction`\<(`this`: [`DefinedCreateInfiniteQueryResult`](../type-aliases/DefinedCreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is DefinedCreateInfiniteQueryResult<TData, TError, InfiniteQueryObserverRefetchErrorResult<TData, TError>>`\> |
| <a id="ispending"></a> `isPending` | `SignalFunction`\<(`this`: [`DefinedCreateInfiniteQueryResult`](../type-aliases/DefinedCreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is never`\> |
| <a id="issuccess"></a> `isSuccess` | `SignalFunction`\<(`this`: [`DefinedCreateInfiniteQueryResult`](../type-aliases/DefinedCreateInfiniteQueryResult.md)\<`TData`, `TError`\>) => `this is DefinedCreateInfiniteQueryResult<TData, TError, InfiniteQueryObserverSuccessResult<TData, TError>>`\> |
