---
id: CreateMutationOptions
title: CreateMutationOptions
---

Defined in: [packages/angular-query/src/types.ts:295](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L295)

The options accepted by `injectMutation`. Same as [MutationObserverOptions](MutationObserverOptions.md) from
`@tanstack/query-core`, minus the internal `_defaulted` flag.

## Extends

- [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`MutationObserverOptions`](MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"_defaulted"` \| `"throwOnError"`\>

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

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="gctime"></a> `gcTime?` | `number` | The time in milliseconds that an unused/inactive mutation remains in memory before it is garbage collected. Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR. |
| <a id="meta"></a> `meta?` | `Record`\<`string`, `unknown`\> | - |
| <a id="mutationfn"></a> `mutationFn?` | [`MutationFunction`](../type-aliases/MutationFunction.md)\<`TData`, `TVariables`\> | - |
| <a id="mutationkey"></a> `mutationKey?` | readonly `unknown`[] | - |
| <a id="networkmode"></a> `networkMode?` | [`NetworkMode`](../type-aliases/NetworkMode.md) | Controls whether a mutation is allowed to run based on the current network connectivity. Defaults to `'online'`. **See** [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information. |
| <a id="onerror"></a> `onError?` | (`error`: `TError`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | - |
| <a id="onmutate"></a> `onMutate?` | (`variables`: `TVariables`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `TOnMutateResult` \| `Promise`\<`TOnMutateResult`\> | - |
| <a id="onsettled"></a> `onSettled?` | (`data`: `TData` \| `undefined`, `error`: `TError` \| `null`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult` \| `undefined`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | - |
| <a id="onsuccess"></a> `onSuccess?` | (`data`: `TData`, `variables`: `TVariables`, `onMutateResult`: `TOnMutateResult`, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | - |
| <a id="retry"></a> `retry?` | `RetryValue`\<`TError`\> | If `false`, failed mutations will not retry by default. If `true`, failed mutations will retry infinitely. If set to an integer number, e.g. 3, failed mutations will retry until the failed mutation count meets that number. If set to a function `(failureCount, error) => boolean` failed mutations will retry until the function returns false. Defaults to `0`. |
| <a id="retrydelay"></a> `retryDelay?` | `RetryDelayValue`\<`TError`\> | This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds. Defaults to a function that applies exponential backoff, capped at 30 seconds. |
| <a id="scope"></a> `scope?` | [`MutationScope`](../type-aliases/MutationScope.md) | - |
