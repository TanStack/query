---
id: BaseMutationNarrowing
title: BaseMutationNarrowing
---

Defined in: packages/angular-query/src/types.ts:365

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-iserror"></a> `isError` | `SignalFunction`\<(`this`: [`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverErrorResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>`\> | Whether the mutation is in the `error` state. Calling it narrows the result to that state. |
| <a id="property-isidle"></a> `isIdle` | `SignalFunction`\<(`this`: [`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverIdleResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>`\> | Whether the mutation is in the `idle` state. Calling it narrows the result to that state. |
| <a id="property-ispending"></a> `isPending` | `SignalFunction`\<(`this`: [`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverLoadingResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>`\> | Whether the mutation is in the `pending` state. Calling it narrows the result to that state. |
| <a id="property-issuccess"></a> `isSuccess` | `SignalFunction`\<(`this`: [`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverSuccessResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>`\> | Whether the mutation is in the `success` state. Calling it narrows the result to that state. |
