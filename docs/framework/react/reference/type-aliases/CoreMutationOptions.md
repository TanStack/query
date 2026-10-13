---
id: CoreMutationOptions
title: CoreMutationOptions
---

```ts
type CoreMutationOptions<TData, TError, TVariables, TOnMutateResult> = OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>, "_defaulted">;
```

Defined in: [packages/query-core/src/mutationOptions.ts:11](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationOptions.ts#L11)

Framework-agnostic options accepted by `mutationOptions`.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
