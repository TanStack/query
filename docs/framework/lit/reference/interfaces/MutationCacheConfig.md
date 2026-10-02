---
id: MutationCacheConfig
title: MutationCacheConfig
---

Defined in: [packages/query-core/src/mutationCache.ts:26](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L26)

Global callbacks that fire for every mutation handled by a `MutationCache`, regardless of which
component or observer triggered it. They differ from the `defaultOptions` provided to a
`QueryClient` in two ways: `defaultOptions` can be overridden by each mutation, while these
callbacks are always called, and `onMutate` here does not allow returning a result.

If a callback returns a promise, it will be awaited before the mutation continues.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onerror"></a> `onError?` | (`error`: `Error`, `variables`: `unknown`, `onMutateResult`: `unknown`, `mutation`: [`Mutation`](../classes/Mutation.md)\<`unknown`, `unknown`, `unknown`\>, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | Called when any mutation in the cache encounters an error. |
| <a id="onmutate"></a> `onMutate?` | (`variables`: `unknown`, `mutation`: [`Mutation`](../classes/Mutation.md)\<`unknown`, `unknown`, `unknown`\>, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | Called before any mutation in the cache executes. |
| <a id="onsettled"></a> `onSettled?` | (`data`: `unknown`, `error`: `Error` \| `null`, `variables`: `unknown`, `onMutateResult`: `unknown`, `mutation`: [`Mutation`](../classes/Mutation.md)\<`unknown`, `unknown`, `unknown`\>, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | Called when any mutation in the cache is settled, either successfully or with an error. |
| <a id="onsuccess"></a> `onSuccess?` | (`data`: `unknown`, `variables`: `unknown`, `onMutateResult`: `unknown`, `mutation`: [`Mutation`](../classes/Mutation.md)\<`unknown`, `unknown`, `unknown`\>, `context`: [`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)) => `unknown` | Called when any mutation in the cache is successful. |
