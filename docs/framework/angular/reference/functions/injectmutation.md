---
id: injectMutation
title: injectMutation
---

# Function: injectMutation()

```ts
function injectMutation<TData, TError, TVariables, TScope>(
  injectMutationFn,
  options?,
): CreateMutationResult<TData, TError, TVariables, TScope>
```

Injects a mutation: an imperative function that can be invoked which typically performs server side effects.

Unlike queries, mutations are not run automatically.

## Type Parameters

• **TData** = `unknown`

• **TError** = `Error`

• **TVariables** = `void`

• **TScope** = `unknown`

## Parameters

### injectMutationFn

() => [`CreateMutationOptions`](../../interfaces/createmutationoptions.md)\<`TData`, `TError`, `TVariables`, `TScope`\>

A function that returns mutation options.

### options?

[`InjectMutationOptions`](../../interfaces/injectmutationoptions.md)

Additional configuration

## Returns

[`CreateMutationResult`](../../type-aliases/createmutationresult.md)\<`TData`, `TError`, `TVariables`, `TScope`\>

The mutation.

## Defined in

[inject-mutation.ts:42](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation.ts#L42)
