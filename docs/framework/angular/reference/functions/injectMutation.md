---
id: injectMutation
title: injectMutation
---

# Function: injectMutation()

```ts
function injectMutation<TData, TError, TVariables, TOnMutateResult>(injectMutationFn, options?): CreateMutationResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [inject-mutation.ts:45](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation.ts#L45)

Injects a mutation: an imperative function that can be invoked which typically performs server side effects.

Unlike queries, mutations are not run automatically.

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `Error`

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Parameters

### injectMutationFn

() => [`CreateMutationOptions`](../interfaces/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

A function that returns mutation options.

### options?

[`InjectMutationOptions`](../interfaces/InjectMutationOptions.md)

Additional configuration

## Returns

[`CreateMutationResult`](../type-aliases/CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

The mutation.
