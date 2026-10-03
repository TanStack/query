---
id: MutationObserverBaseResult
title: MutationObserverBaseResult
---

Defined in: [packages/query-core/src/types.ts:1430](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1430)

The raw state stored on a `Mutation` instance. This is the underlying state
that observer results (e.g. `MutationObserverResult`) are derived from.

## Extends

- [`MutationState`](MutationState.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

## Extended by

- [`MutationObserverIdleResult`](MutationObserverIdleResult.md)
- [`MutationObserverLoadingResult`](MutationObserverLoadingResult.md)
- [`MutationObserverErrorResult`](MutationObserverErrorResult.md)
- [`MutationObserverSuccessResult`](MutationObserverSuccessResult.md)

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
| <a id="property-context"></a> `context` | `TOnMutateResult` \| `undefined` | The value returned by `onMutate`, if defined. Passed to `onSuccess`, `onError` and `onSettled` as the mutation's context. | - |
| <a id="property-data"></a> `data` | `TData` \| `undefined` | The last successfully resolved data for the mutation. | [`MutationState`](MutationState.md).[`data`](MutationState.md#property-data) |
| <a id="property-error"></a> `error` | `TError` \| `null` | The error object for the mutation, if an error was encountered. - Defaults to `null`. | [`MutationState`](MutationState.md).[`error`](MutationState.md#property-error) |
| <a id="property-failurecount"></a> `failureCount` | `number` | The number of times the mutation function has failed for the current attempt. | - |
| <a id="property-failurereason"></a> `failureReason` | `TError` \| `null` | The reason the current attempt failed, as reported by the retryer. | - |
| <a id="property-iserror"></a> `isError` | `boolean` | A boolean variable derived from `status`. - `true` if the last mutation attempt resulted in an error. | - |
| <a id="property-isidle"></a> `isIdle` | `boolean` | A boolean variable derived from `status`. - `true` if the mutation is in its initial state prior to executing. | - |
| <a id="property-ispaused"></a> `isPaused` | `boolean` | Whether the mutation is currently paused (see network mode), or is waiting for another mutation with the same `scope` to finish. | - |
| <a id="property-ispending"></a> `isPending` | `boolean` | A boolean variable derived from `status`. - `true` if the mutation is currently executing. | - |
| <a id="property-issuccess"></a> `isSuccess` | `boolean` | A boolean variable derived from `status`. - `true` if the last mutation attempt was successful. | - |
| <a id="property-mutate"></a> `mutate` | [`MutateFunction`](../type-aliases/MutateFunction.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\> | The mutation function you can call with variables to trigger the mutation and optionally hooks on additional callback options. **Param** **variables** The variables object to pass to the `mutationFn`. **Param** **options.onSuccess** This function will fire when the mutation is successful and will be passed the mutation's result. **Param** **options.onError** This function will fire if the mutation encounters an error and will be passed the error. **Param** **options.onSettled** This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error. **Remarks** - If you make multiple requests, `onSuccess` will fire only after the latest call you've made. - All the callback functions (`onSuccess`, `onError`, `onSettled`) are void functions, and the returned value will be ignored. | - |
| <a id="property-reset"></a> `reset` | () => `void` | A function to clean the mutation internal state (i.e., it resets the mutation to its initial state). | - |
| <a id="property-status"></a> `status` | `"error"` \| `"pending"` \| `"success"` \| `"idle"` | The status of the mutation. - Will be: - `idle` initial status prior to the mutation function executing. - `pending` if the mutation is currently executing. - `error` if the last mutation attempt resulted in an error. - `success` if the last mutation attempt was successful. | [`MutationState`](MutationState.md).[`status`](MutationState.md#property-status) |
| <a id="property-submittedat"></a> `submittedAt` | `number` | The timestamp for when the mutation was submitted. | - |
| <a id="property-variables"></a> `variables` | `TVariables` \| `undefined` | The variables object passed to the `mutationFn`. | [`MutationState`](MutationState.md).[`variables`](MutationState.md#property-variables) |
