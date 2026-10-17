---
id: injectMutationState
title: injectMutationState
---

```ts
function injectMutationState<TResult, TMutation>(options?: () => MutationStateOptions<TResult, TMutation>): Signal<TResult[]>;
```

Defined in: packages/angular-query/src/inject-mutation-state.ts:70

Injects a signal that tracks the state of all mutations.

## Type Parameters

### TResult

`TResult` = [`MutationState`](../interfaces/MutationState.md)\<`unknown`, `Error`, `unknown`, `unknown`\>

### TMutation

`TMutation` *extends* [`Mutation`](../classes/Mutation.md)\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Parameters

### options?

() => [`MutationStateOptions`](../type-aliases/MutationStateOptions.md)\<`TResult`, `TMutation`\>

A function that returns mutation state options.

<a id="options-properties"></a>

#### `options` properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="options-property-filters"></a> `filters?` | [`MutationFilters`](../interfaces/MutationFilters.md) | Restricts the mutation cache entries included in the result. |
| <a id="options-property-select"></a> `select?` | (`mutation`: `TMutation`) => `TResult` | Maps each matching mutation to the value exposed in the result signal. |

## Returns

`Signal`\<`TResult`[]\>

The signal that tracks the state of all mutations.
