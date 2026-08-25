---
id: UseMutationOptions
title: UseMutationOptions
---

Defined in: [preact-query/src/types.ts:332](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L332)

The options accepted by `useMutation`. Same as MutationObserverOptions from `@tanstack/query-core`,
minus the internal `_defaulted` flag.

## Extends

- `OmitKeyof`\<`MutationObserverOptions`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"_defaulted"`\>

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
