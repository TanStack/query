---
id: DefinedQueryNarrowing
title: DefinedQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:95](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L95)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="iserror"></a> `isError` | `SignalFunction`\<(`this`: [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>) => `this is DefinedCreateQueryResult<TData, TError, QueryObserverRefetchErrorResult<TData, TError>>`\> |
| <a id="ispending"></a> `isPending` | `SignalFunction`\<(`this`: [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>) => `this is never`\> |
| <a id="issuccess"></a> `isSuccess` | `SignalFunction`\<(`this`: [`DefinedCreateQueryResult`](../type-aliases/DefinedCreateQueryResult.md)\<`TData`, `TError`\>) => `this is DefinedCreateQueryResult<TData, TError, QueryObserverSuccessResult<TData, TError>>`\> |
