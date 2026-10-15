---
id: MutationObserverIdleResult
title: MutationObserverIdleResult
---

Defined in: [packages/query-core/src/types.ts:2153](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L2153)

A mutation result in the `idle` state: the mutation hasn't run yet, or was reset.

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
| <a id="property-context"></a> `context` | `TOnMutateResult` \| `undefined` | The value returned by `onMutate`, if defined. Passed to `onSuccess`, `onError` and `onSettled` as the mutation's context. | - |
| <a id="property-data"></a> `data` | `undefined` | `undefined`, since the mutation hasn't run. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`data`](MutationObserverBaseResult.md#property-data) |
| <a id="property-error"></a> `error` | `null` | `null`, since the mutation hasn't failed. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`error`](MutationObserverBaseResult.md#property-error) |
| <a id="property-failurecount"></a> `failureCount` | `number` | The number of times the mutation function has failed for the current attempt. | - |
| <a id="property-failurereason"></a> `failureReason` | `TError` \| `null` | The reason the current attempt failed, as reported by the retryer. | - |
| <a id="property-iserror"></a> `isError` | `false` | `false`, since the mutation hasn't failed. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isError`](MutationObserverBaseResult.md#property-iserror) |
| <a id="property-isidle"></a> `isIdle` | `true` | `true`, since the mutation hasn't run yet or was reset. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isIdle`](MutationObserverBaseResult.md#property-isidle) |
| <a id="property-ispaused"></a> `isPaused` | `boolean` | Whether the mutation is currently paused (see network mode), or is waiting for another mutation with the same `scope` to finish. | - |
| <a id="property-ispending"></a> `isPending` | `false` | `false`, since the mutation isn't running. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isPending`](MutationObserverBaseResult.md#property-ispending) |
| <a id="property-issuccess"></a> `isSuccess` | `false` | `false`, since the mutation hasn't succeeded. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`isSuccess`](MutationObserverBaseResult.md#property-issuccess) |
| <a id="property-mutate"></a> `mutate` | [`MutateFunction`](../type-aliases/MutateFunction.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\> | The mutation function you can call with variables to trigger the mutation and optionally hooks on additional callback options. **Param** **variables** The variables object to pass to the `mutationFn`. **Param** **options.onSuccess** This function will fire when the mutation is successful and will be passed the mutation's result. **Param** **options.onError** This function will fire if the mutation encounters an error and will be passed the error. **Param** **options.onSettled** This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error. **Remarks** - If you make multiple requests, `onSuccess` will fire only after the latest call you've made. - All the callback functions (`onSuccess`, `onError`, `onSettled`) are void functions, and the returned value will be ignored. | - |
| <a id="property-reset"></a> `reset` | () => `void` | A function to clean the mutation internal state (i.e., it resets the mutation to its initial state). | - |
| <a id="property-status"></a> `status` | `"idle"` | `'idle'`, since the mutation hasn't run yet or was reset. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`status`](MutationObserverBaseResult.md#property-status) |
| <a id="property-submittedat"></a> `submittedAt` | `number` | The timestamp for when the mutation was submitted. | - |
| <a id="property-variables"></a> `variables` | `undefined` | `undefined`, since the mutation hasn't run. | [`MutationObserverBaseResult`](MutationObserverBaseResult.md).[`variables`](MutationObserverBaseResult.md#property-variables) |
