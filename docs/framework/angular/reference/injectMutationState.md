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

• **options?**: [`InjectMutationStateOptions`](InjectMutationStateOptions.md)

The Angular injector to use.

## Returns

`Signal`\<`TResult`[]\>

The signal that tracks the state of all mutations.

## Defined in

[inject-mutation-state.ts:53](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/inject-mutation-state.ts#L53)
