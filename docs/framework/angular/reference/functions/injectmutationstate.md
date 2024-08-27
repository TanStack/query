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

• **mutationStateOptionsFn** = `...`

A function that returns mutation state options.

• **options?**: [`InjectMutationStateOptions`](../interfaces/injectmutationstateoptions.md)

The Angular injector to use.

## Returns

`Signal`\<`TResult`[]\>

The signal that tracks the state of all mutations.

## Defined in

[inject-mutation-state.ts:53](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/inject-mutation-state.ts#L53)
