---
id: UseMutationOptions
title: UseMutationOptions
---

```ts
type UseMutationOptions<TData, TError, TVariables, TOnMutateResult> = Accessor<MutationOptions<TData, TError, TVariables, TOnMutateResult>>;
```

Defined in: [packages/solid-query/src/types.ts:260](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L260)

The accessor `useMutation` expects as its first argument — Solid re-evaluates it reactively, so callbacks
and other options can depend on signals.

## Type Parameters

### TData

`TData` = `unknown`

The type your `mutationFn` resolves to.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `mutationFn` may throw.

### TVariables

`TVariables` = `void`

The type of the variables your `mutationFn` accepts.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed on to `onSuccess`/`onError`/`onSettled`.
