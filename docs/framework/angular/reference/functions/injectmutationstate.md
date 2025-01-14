---
id: injectMutationState
title: injectMutationState
---

# Function: injectMutationState()

```ts
function injectMutationState<TResult>(
  mutationStateOptionsFn,
  options?,
): Signal<TResult[]>
```

Injects a signal that tracks the state of all mutations.

## Type Parameters

• **TResult** = `MutationState`\<`unknown`, `Error`, `unknown`, `unknown`\>

## Parameters

### mutationStateOptionsFn

() => `MutationStateOptions`\<`TResult`\>

A function that returns mutation state options.

### options?

[`InjectMutationStateOptions`](../interfaces/injectmutationstateoptions.md)

The Angular injector to use.

## Returns

`Signal`\<`TResult`[]\>

The signal that tracks the state of all mutations.

## Defined in

[inject-mutation-state.ts:47](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation-state.ts#L47)
