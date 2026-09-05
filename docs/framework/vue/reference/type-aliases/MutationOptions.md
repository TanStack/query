---
id: MutationOptions
title: MutationOptions
---

```ts
type MutationOptions<TData, TError, TVariables, TOnMutateResult> = OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>, "_defaulted"> & ShallowOption;
```

Defined in: [vue-query/src/types.ts:85](https://github.com/TanStack/query/blob/main/packages/vue-query/src/types.ts#L85)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`
