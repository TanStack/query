---
id: MutationOptions
title: MutationOptions
---

```ts
type MutationOptions<TData, TError, TVariables, TOnMutateResult> = OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>, "_defaulted"> & ShallowOption;
```

Defined in: [packages/vue-query/src/types.ts:98](https://github.com/TanStack/query/blob/main/packages/vue-query/src/types.ts#L98)

The options of a mutation. Same as [MutationObserverOptions](../interfaces/MutationObserverOptions.md) from `@tanstack/query-core`, minus the
internal `_defaulted` flag, plus the `shallow` option.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
