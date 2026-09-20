---
id: BaseMutationNarrowing
title: BaseMutationNarrowing
---

Defined in: [packages/angular-query/src/types.ts:386](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L386)

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

| Property | Type |
| ------ | ------ |
| <a id="iserror"></a> `isError` | `SignalFunction`\<(`this`: [`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverErrorResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>`\> |
| <a id="isidle"></a> `isIdle` | `SignalFunction`\<(`this`: [`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverIdleResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>`\> |
| <a id="ispending"></a> `isPending` | `SignalFunction`\<(`this`: [`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverLoadingResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>`\> |
| <a id="issuccess"></a> `isSuccess` | `SignalFunction`\<(`this`: [`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>) => `this is CreateMutationResult<TData, TError, TVariables, TOnMutateResult, Override<MutationObserverSuccessResult<TData, TError, TVariables, TOnMutateResult>, { mutate: CreateMutateFunction<TData, TError, TVariables, TOnMutateResult> }> & { mutateAsync: CreateMutateAsyncFunction<TData, TError, TVariables, TOnMutateResult> }>`\> |
