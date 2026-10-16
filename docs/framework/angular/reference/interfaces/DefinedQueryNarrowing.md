---
id: DefinedQueryNarrowing
title: DefinedQueryNarrowing
---

Defined in: packages/angular-query/src/types.ts:89

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-iserror"></a> `isError` | `SignalFunction`\<() => `this is DefinedCreateQueryResult<TData, TError, QueryObserverRefetchErrorResult<TData, TError>>`\> |
| <a id="property-ispending"></a> `isPending` | `SignalFunction`\<() => `this is never`\> |
| <a id="property-issuccess"></a> `isSuccess` | `SignalFunction`\<() => `this is DefinedCreateQueryResult<TData, TError, QueryObserverSuccessResult<TData, TError>>`\> |
