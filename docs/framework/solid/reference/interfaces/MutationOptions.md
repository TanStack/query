---
id: MutationOptions
title: MutationOptions
---

Defined in: [types.ts:241](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L241)

The options accepted by `useMutation` and `mutationOptions`.

## Extends

- `OmitKeyof`\<`MutationObserverOptions`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"_defaulted"`\>

## Type Parameters

### TData

`TData` = `unknown`

The type your `mutationFn` resolves to.

### TError

`TError` = `DefaultError`

The type of errors your `mutationFn` may throw.

### TVariables

`TVariables` = `void`

The type of the variables your `mutationFn` accepts.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed on to `onSuccess`/`onError`/`onSettled`.
