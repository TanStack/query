---
id: DefinedQueryNarrowing
title: DefinedQueryNarrowing
---

Defined in: packages/angular-query/src/types.ts:108

Signal-backed guards for a query whose initial data excludes the pending state.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-iserror"></a> `isError` | `SignalFunction`\<() => `this is DefinedCreateQueryResult<TData, TError, QueryObserverRefetchErrorResult<TData, TError>>`\> | Returns whether the result failed and narrows its data and error signals. |
| <a id="property-ispending"></a> `isPending` | `SignalFunction`\<() => `this is never`\> | Narrows the result to the pending state when that state is possible. |
| <a id="property-issuccess"></a> `isSuccess` | `SignalFunction`\<() => `this is DefinedCreateQueryResult<TData, TError, QueryObserverSuccessResult<TData, TError>>`\> | Returns whether the result is successful and narrows its data and error signals. |
