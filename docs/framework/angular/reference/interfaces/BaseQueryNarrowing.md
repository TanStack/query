---
id: BaseQueryNarrowing
title: BaseQueryNarrowing
---

Defined in: packages/angular-query/src/types.ts:65

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-iserror"></a> `isError` | `SignalFunction`\<() => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>`\> |
| <a id="property-ispending"></a> `isPending` | `SignalFunction`\<() => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>`\> |
| <a id="property-issuccess"></a> `isSuccess` | `SignalFunction`\<() => `this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>`\> |
