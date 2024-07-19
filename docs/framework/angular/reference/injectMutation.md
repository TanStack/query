---
id: injectMutation
title: injectMutation
---

# Function: injectMutation()

```ts
function injectMutation<TData, TError, TVariables, TContext>(optionsFn, injector?): CreateMutationResult<TData, TError, TVariables, TContext>
```

Injects a mutation: an imperative function that can be invoked which typically performs server side effects.

Unlike queries, mutations are not run automatically.

## Type Parameters

• **TData** = `unknown`

• **TError** = `Error`

• **TVariables** = `void`

• **TContext** = `unknown`

## Parameters

• **optionsFn**

A function that returns mutation options.

• **injector?**: `Injector`

The Angular injector to use.

## Returns

[`CreateMutationResult`](CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TContext`\>

The mutation.

## Defined in

[inject-mutation.ts:38](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/inject-mutation.ts#L38)
