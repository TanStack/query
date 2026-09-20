---
id: injectMutationState
title: injectMutationState
---

```ts
function injectMutationState<TResult, TMutation>(options: () => MutationStateOptions<TResult, TMutation>): Signal<TResult[]>;
```

Defined in: [packages/angular-query/src/inject-mutation-state.ts:55](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-mutation-state.ts#L55)

Injects a signal that tracks the state of all mutations.

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Parameters

### options

() => [`MutationStateOptions`](../type-aliases/MutationStateOptions.md)\<`TResult`, `TMutation`\>

A function that returns mutation state options.

## Returns

`Signal`\<`TResult`[]\>

The signal that tracks the state of all mutations.
