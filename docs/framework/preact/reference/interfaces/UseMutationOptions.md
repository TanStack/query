---
id: UseMutationOptions
title: UseMutationOptions
---

Defined in: [packages/preact-query/src/types.ts:411](https://github.com/TanStack/query/blob/main/packages/preact-query/src/types.ts#L411)

The options accepted by `useMutation`. Same as [MutationObserverOptions](MutationObserverOptions.md) from `@tanstack/query-core`,
minus the internal `_defaulted` flag.

## Extends

- [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`MutationObserverOptions`](MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"_defaulted"`\>

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `void`

The type of the variable passed to `mutate`/`mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.

## Properties

### gcTime?

```ts
optional gcTime: number;
```

Defined in: [packages/query-core/src/types.ts:1248](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1248)

The time in milliseconds that an unused/inactive mutation remains in memory before it is
garbage collected.

Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR.

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`gcTime`](MutationOptions.md#gctime)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1251](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1251)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`meta`](MutationOptions.md#meta)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: [packages/query-core/src/types.ts:1196](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1196)

#### Inherited from

```ts
OmitKeyof.mutationFn
```

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/types.ts:1197](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1197)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`mutationKey`](MutationOptions.md#mutationkey)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:1241](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1241)

Defaults to `'online'`.

#### See

[Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`networkMode`](MutationOptions.md#networkmode)

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

#### Inherited from

```ts
OmitKeyof.onError
```

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

#### Inherited from

```ts
OmitKeyof.onMutate
```

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

#### Inherited from

```ts
OmitKeyof.onSettled
```

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

#### Inherited from

```ts
OmitKeyof.onSuccess
```

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

#### Inherited from

```ts
OmitKeyof.retry
```

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1236](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1236)

This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the
next attempt in milliseconds.

Defaults to a function that applies exponential backoff, capped at 30 seconds.

#### Inherited from

```ts
OmitKeyof.retryDelay
```

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: [packages/query-core/src/types.ts:1252](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1252)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`scope`](MutationOptions.md#scope)

***

### throwOnError?

```ts
optional throwOnError: boolean | (error) => boolean;
```

Defined in: [packages/query-core/src/types.ts:1261](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1261)

#### Inherited from

```ts
OmitKeyof.throwOnError
```
