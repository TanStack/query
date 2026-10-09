---
id: MutationResult
title: MutationResult
---

```ts
type MutationResult<TData, TError, TVariables, TOnMutateResult> = DistributiveOmit<MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, "mutate" | "reset">;
```

Defined in: [packages/vue-query/src/useMutation.ts:29](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutation.ts#L29)

The plain mutation result shape that `useMutation` wraps in `Ref`s: [MutationObserverResult](MutationObserverResult.md)
without `mutate` and `reset`

## Type Parameters

### TData

`TData`

### TError

`TError`

### TVariables

`TVariables`

### TOnMutateResult

`TOnMutateResult`
