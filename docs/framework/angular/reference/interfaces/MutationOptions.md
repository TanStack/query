---
id: MutationOptions
title: MutationOptions
---

Defined in: [packages/query-core/src/types.ts:1190](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1190)

## Extended by

- [`MutationObserverOptions`](MutationObserverOptions.md)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Properties

### gcTime?

```ts
optional gcTime: number;
```

Defined in: [packages/query-core/src/types.ts:1248](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1248)

The time in milliseconds that an unused/inactive mutation remains in memory before it is
garbage collected.

Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR.

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1251](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1251)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: [packages/query-core/src/types.ts:1196](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1196)

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/types.ts:1197](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1197)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:1241](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1241)

Defaults to `'online'`.

#### See

[Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.

***

### onError()?

```ts
optional onError: (error, variables, onMutateResult, context) => unknown;
```

Defined in: [packages/query-core/src/types.ts:1208](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1208)

#### Parameters

##### error

`TError`

##### variables

`TVariables`

##### onMutateResult

`TOnMutateResult` | `undefined`

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`unknown`

***

### onMutate()?

```ts
optional onMutate: (variables, context) => TOnMutateResult | Promise<TOnMutateResult>;
```

Defined in: [packages/query-core/src/types.ts:1198](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1198)

#### Parameters

##### variables

`TVariables`

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`TOnMutateResult` \| `Promise`\<`TOnMutateResult`\>

***

### onSettled()?

```ts
optional onSettled: (data, error, variables, onMutateResult, context) => unknown;
```

Defined in: [packages/query-core/src/types.ts:1214](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1214)

#### Parameters

##### data

`TData` | `undefined`

##### error

`TError` | `null`

##### variables

`TVariables`

##### onMutateResult

`TOnMutateResult` | `undefined`

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`unknown`

***

### onSuccess()?

```ts
optional onSuccess: (data, variables, onMutateResult, context) => unknown;
```

Defined in: [packages/query-core/src/types.ts:1202](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1202)

#### Parameters

##### data

`TData`

##### variables

`TVariables`

##### onMutateResult

`TOnMutateResult`

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`unknown`

***

### retry?

```ts
optional retry: RetryValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1229](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1229)

If `false`, failed mutations will not retry by default.
If `true`, failed mutations will retry infinitely.
If set to an integer number, e.g. 3, failed mutations will retry until the failed mutation count meets that number.
If set to a function `(failureCount, error) => boolean` failed mutations will retry until the function returns false.

Defaults to `0`.

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1236](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1236)

This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the
next attempt in milliseconds.

Defaults to a function that applies exponential backoff, capped at 30 seconds.

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: [packages/query-core/src/types.ts:1252](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1252)
