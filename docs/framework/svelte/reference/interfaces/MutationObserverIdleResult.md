---
id: MutationObserverIdleResult
title: MutationObserverIdleResult
---

Defined in: [packages/query-core/src/types.ts:1461](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1461)

The raw state stored on a `Mutation` instance. This is the underlying state
that observer results (e.g. `MutationObserverResult`) are derived from.

## Extends

- [`MutationObserverBaseResult`](MutationObserverBaseResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Properties

| Property | Type | Description | Overrides |
| ------ | ------ | ------ | ------ |
| <a id="context"></a> `context` | `TOnMutateResult` \| `undefined` | The value returned by `onMutate`, if defined. Passed to `onSuccess`, `onError` and `onSettled` as the mutation's context. | - |
| <a id="data"></a> `data` | `undefined` | The last successfully resolved data for the mutation. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`data`](MutationObserverBaseResult.md#data) |
| <a id="error"></a> `error` | `null` | The error object for the mutation, if an error was encountered. - Defaults to `null`. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`error`](MutationObserverBaseResult.md#error) |
| <a id="failurecount"></a> `failureCount` | `number` | The number of times the mutation function has failed for the current attempt. | - |
| <a id="failurereason"></a> `failureReason` | `TError` \| `null` | The reason the current attempt failed, as reported by the retryer. | - |
| <a id="iserror"></a> `isError` | `false` | A boolean variable derived from `status`. - `true` if the last mutation attempt resulted in an error. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isError`](MutationObserverBaseResult.md#iserror) |
| <a id="isidle"></a> `isIdle` | `true` | A boolean variable derived from `status`. - `true` if the mutation is in its initial state prior to executing. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isIdle`](MutationObserverBaseResult.md#isidle) |
| <a id="ispaused"></a> `isPaused` | `boolean` | Whether the mutation is currently paused (see network mode), or is waiting for another mutation with the same `scope` to finish. | - |
| <a id="ispending"></a> `isPending` | `false` | A boolean variable derived from `status`. - `true` if the mutation is currently executing. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isPending`](MutationObserverBaseResult.md#ispending) |
| <a id="issuccess"></a> `isSuccess` | `false` | A boolean variable derived from `status`. - `true` if the last mutation attempt was successful. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isSuccess`](MutationObserverBaseResult.md#issuccess) |
| <a id="mutate"></a> `mutate` | [`MutateFunction`](../type-aliases/MutateFunction.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\> | The mutation function you can call with variables to trigger the mutation and optionally hooks on additional callback options. **Param** The variables object to pass to the `mutationFn`. **Param** This function will fire when the mutation is successful and will be passed the mutation's result. **Param** This function will fire if the mutation encounters an error and will be passed the error. **Param** This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error. **Remarks** - If you make multiple requests, `onSuccess` will fire only after the latest call you've made. - All the callback functions (`onSuccess`, `onError`, `onSettled`) are void functions, and the returned value will be ignored. | - |
| <a id="reset"></a> `reset` | () => `void` | A function to clean the mutation internal state (i.e., it resets the mutation to its initial state). | - |
| <a id="status"></a> `status` | `"idle"` | The status of the mutation. - Will be: - `idle` initial status prior to the mutation function executing. - `pending` if the mutation is currently executing. - `error` if the last mutation attempt resulted in an error. - `success` if the last mutation attempt was successful. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`status`](MutationObserverBaseResult.md#status) |
| <a id="submittedat"></a> `submittedAt` | `number` | The timestamp for when the mutation was submitted. | - |
| <a id="variables"></a> `variables` | `undefined` | The variables object passed to the `mutationFn`. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`variables`](MutationObserverBaseResult.md#variables) |
