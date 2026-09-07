---
id: MutationCacheConfig
title: MutationCacheConfig
---

Defined in: [packages/query-core/src/mutationCache.ts:26](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L26)

Global callbacks that fire for every mutation handled by a `MutationCache`, regardless of which
component or observer triggered it. They differ from the `defaultOptions` provided to a
`QueryClient` in two ways: `defaultOptions` can be overridden by each mutation, while these
callbacks are always called, and `onMutate` here does not allow returning a result.

If a callback returns a promise, it will be awaited before the mutation continues.

## Properties

### onError()?

```ts
optional onError: (error, variables, onMutateResult, mutation, context) => unknown;
```

Defined in: [packages/query-core/src/mutationCache.ts:28](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L28)

Called when any mutation in the cache encounters an error.

#### Parameters

##### error

`Error`

##### variables

`unknown`

##### onMutateResult

`unknown`

##### mutation

[`Mutation`](../classes/Mutation.md)\<`unknown`, `unknown`, `unknown`\>

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`unknown`

***

### onMutate()?

```ts
optional onMutate: (variables, mutation, context) => unknown;
```

Defined in: [packages/query-core/src/mutationCache.ts:44](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L44)

Called before any mutation in the cache executes.

#### Parameters

##### variables

`unknown`

##### mutation

[`Mutation`](../classes/Mutation.md)\<`unknown`, `unknown`, `unknown`\>

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`unknown`

***

### onSettled()?

```ts
optional onSettled: (data, error, variables, onMutateResult, mutation, context) => unknown;
```

Defined in: [packages/query-core/src/mutationCache.ts:50](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L50)

Called when any mutation in the cache is settled, either successfully or with an error.

#### Parameters

##### data

`unknown`

##### error

`Error` | `null`

##### variables

`unknown`

##### onMutateResult

`unknown`

##### mutation

[`Mutation`](../classes/Mutation.md)\<`unknown`, `unknown`, `unknown`\>

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`unknown`

***

### onSuccess()?

```ts
optional onSuccess: (data, variables, onMutateResult, mutation, context) => unknown;
```

Defined in: [packages/query-core/src/mutationCache.ts:36](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationCache.ts#L36)

Called when any mutation in the cache is successful.

#### Parameters

##### data

`unknown`

##### variables

`unknown`

##### onMutateResult

`unknown`

##### mutation

[`Mutation`](../classes/Mutation.md)\<`unknown`, `unknown`, `unknown`\>

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`unknown`
