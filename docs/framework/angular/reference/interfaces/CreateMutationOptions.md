---
id: CreateMutationOptions
title: CreateMutationOptions
---

Defined in: [types.ts:224](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L224)

The options accepted by `injectMutation`. Same as MutationObserverOptions from
`@tanstack/query-core`, minus the internal `_defaulted` flag.

## Extends

- `OmitKeyof`\<`MutationObserverOptions`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"_defaulted"`\>

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = `DefaultError`

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `void`

The type of the variable passed to `mutate`/`mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.
