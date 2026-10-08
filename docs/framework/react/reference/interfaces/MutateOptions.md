---
id: MutateOptions
title: MutateOptions
---

Defined in: [packages/query-core/src/types.ts:2013](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L2013)

The callbacks that can be passed to `mutate` for a single call. They run after the callbacks of
the mutation options.

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

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-onerror"></a> `onError?` | (`error`: `TError`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `void` | Called when the mutation of this call fails, after the `onError` of the mutation options. |
| <a id="property-onsettled"></a> `onSettled?` | (`data`: `TData` \| `undefined`, `error`: `TError` \| `null`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `void` | Called when the mutation of this call succeeds or fails, after the `onSettled` of the mutation options. |
| <a id="property-onsuccess"></a> `onSuccess?` | (`data`: `TData`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `void` | Called when the mutation of this call succeeds, after the `onSuccess` of the mutation options. |
