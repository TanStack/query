---
id: MutationStateAccessor
title: MutationStateAccessor
---

# Type Alias: MutationStateAccessor\<TResult\>

```ts
type MutationStateAccessor<TResult> = ValueAccessor<TResult[]> & object;
```

Defined in: [packages/lit-query/src/useMutationState.ts:32](https://github.com/TanStack/query/blob/main/packages/lit-query/src/useMutationState.ts#L32)

Accessor returned by `useMutationState`.

Call the accessor or read its `current` property to get the selected state for
matching mutations.

## Type Declaration

### destroy()

```ts
destroy: () => void;
```

Removes the controller from its Lit host and unsubscribes observers.

#### Returns

`void`

## Type Parameters

### TResult

`TResult`
