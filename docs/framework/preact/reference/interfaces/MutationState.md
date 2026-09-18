---
id: MutationState
title: MutationState
---

Defined in: [packages/query-core/src/mutation.ts:30](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L30)

The raw state stored on a `Mutation` instance. This is the underlying state
that observer results (e.g. `MutationObserverResult`) are derived from.

## Extended by

- [`MutationObserverBaseResult`](MutationObserverBaseResult.md)

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
| <a id="context"></a> `context` | `TOnMutateResult` \| `undefined` | The value returned by `onMutate`, if defined. Passed to `onSuccess`, `onError` and `onSettled` as the mutation's context. |
| <a id="data"></a> `data` | `TData` \| `undefined` | The last successfully resolved data for the mutation. |
| <a id="error"></a> `error` | `TError` \| `null` | The error object for the mutation, if the last attempt resulted in an error. - Defaults to `null`. |
| <a id="failurecount"></a> `failureCount` | `number` | The number of times the mutation function has failed for the current attempt. |
| <a id="failurereason"></a> `failureReason` | `TError` \| `null` | The reason the current attempt failed, as reported by the retryer. |
| <a id="ispaused"></a> `isPaused` | `boolean` | Whether the mutation is currently paused (see network mode), or is waiting for another mutation with the same `scope` to finish. |
| <a id="status"></a> `status` | [`MutationStatus`](../type-aliases/MutationStatus.md) | The status of the mutation. |
| <a id="submittedat"></a> `submittedAt` | `number` | The timestamp for when the mutation was submitted. |
| <a id="variables"></a> `variables` | `TVariables` \| `undefined` | The variables the mutation was last called with. |
