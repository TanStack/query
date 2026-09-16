---
id: CreateMutationOptions
title: CreateMutationOptions
---

Defined in: [packages/angular-query/src/types.ts:241](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L241)

## Extends

- `OmitKeyof`\<`MutationObserverOptions`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"_defaulted"` \| `"throwOnError"`\>

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `void`

The type of the variable passed to `mutate`/`mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="gctime"></a> `gcTime?` | `number` | `undefined` | The time in milliseconds that an unused/inactive mutation remains in memory before it is garbage collected. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. |
| <a id="meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | `undefined` | Additional payload to be stored on the mutation cache entry. Use it to pass information that can be read wherever the `mutation` is available, such as the `onError` and `onSuccess` callbacks of the `MutationCache`. |
| <a id="mutationfn"></a> `mutationFn?` | (`variables`: `TVariables`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `Promise`\<`TData`\> | `undefined` | The function that performs the asynchronous task this mutation runs. Required, unless a default mutation function has been set for the matching `mutationKey` via `queryClient.setMutationDefaults`. Receives the `variables` passed to `mutate`, and a [MutationFunctionContext](../type-aliases/MutationFunctionContext.md) holding the `QueryClient`, the `mutationKey` and `meta`. Must return a promise that resolves the mutation's data. |
| <a id="mutationkey"></a> `mutationKey?` | readonly `unknown`[] | `undefined` | The key to use for this mutation. Optional, but required to inherit defaults registered with `queryClient.setMutationDefaults`, and to match this mutation with `useMutationState` or `queryClient.isMutating`. |
| <a id="networkmode"></a> `networkMode?` | `"online"` \| `"always"` \| `"offlineFirst"` | `'online'` | Controls whether a mutation is allowed to run based on the current network connectivity. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="onerror"></a> `onError?` | (`error`: `TError`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation encounters an error, and is passed the error. If a promise is returned, it is awaited before `onSettled` runs. |
| <a id="onmutate"></a> `onMutate?` | (`variables`: `TVariables`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `TOnMutateResult` \| `Promise`\<`TOnMutateResult`\> | `undefined` | This function fires before the mutation function runs, and receives the same variables. Useful for optimistic updates applied in the hope that the mutation succeeds. The value it returns is passed to `onSuccess`, `onError` and `onSettled` as `onMutateResult`, which is where an optimistic update is usually rolled back. If a promise is returned, it is awaited before the mutation function runs. |
| <a id="onsettled"></a> `onSettled?` | (`data`: `TData` \| `undefined`, `error`: `TError` \| `null`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation either succeeds or errors, and is passed either the data or the error. If a promise is returned, it is awaited before the mutation settles. |
| <a id="onsuccess"></a> `onSuccess?` | (`data`: `TData`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | `undefined` | This function fires when the mutation succeeds, and is passed the mutation's result. If a promise is returned, it is awaited before `onSettled` runs. |
| <a id="retry"></a> `retry?` | \| `number` \| `false` \| `true` \| (`failureCount`: `number`, `error`: `TError`) => `boolean` | `0` | If `false`, failed mutations will not retry by default. If `true`, failed mutations will retry infinitely. If set to an integer number, e.g. 3, failed mutations will retry until the failed mutation count meets that number. If set to a function `(failureCount, error) => boolean` failed mutations will retry until the function returns false. |
| <a id="retrydelay"></a> `retryDelay?` | `number` \| (`failureCount`: `number`, `error`: `TError`) => `number` | `undefined` | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="scope"></a> `scope?` | [`MutationScope`](../type-aliases/MutationScope.md) | `undefined` | Controls whether this mutation runs alongside others or waits its turn. Mutations sharing the same `scope.id` run serially, in the order they were started. Without a scope, a mutation runs as soon as it is triggered. |
| <a id="throwonerror"></a> `throwOnError?` | `boolean` \| (`error`: `TError`) => `boolean` | `false` | Whether errors should be thrown instead of setting the `error` property. If set to `true`, all errors will be thrown to the nearest error boundary. If set to a function, it will be passed the error and should return a boolean indicating whether to throw the error (`true`) or return it as state (`false`). |
