---
id: MutationOptions
title: MutationOptions
---

Defined in: [packages/solid-query/src/types.ts:241](https://github.com/TanStack/query/blob/main/packages/solid-query/src/types.ts#L241)

The options accepted by `useMutation` and `mutationOptions`.

## Extends

- [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`MutationObserverOptions`](MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"_defaulted"`\>

## Type Parameters

### TData

`TData` = `unknown`

The type your `mutationFn` resolves to.

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The type of errors your `mutationFn` may throw.

### TVariables

`TVariables` = `void`

The type of the variables your `mutationFn` accepts.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed on to `onSuccess`/`onError`/`onSettled`.

## Properties

### gcTime?

```ts
optional gcTime: number;
```

Defined in: [packages/query-core/src/types.ts:1213](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1213)

#### Inherited from

[`MutationObserverOptions`](MutationObserverOptions.md).[`gcTime`](MutationObserverOptions.md#gctime)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1216](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1216)

#### Inherited from

[`MutationObserverOptions`](MutationObserverOptions.md).[`meta`](MutationObserverOptions.md#meta)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: [packages/query-core/src/types.ts:1185](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1185)

#### Inherited from

```ts
OmitKeyof.mutationFn
```

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/types.ts:1186](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1186)

#### Inherited from

[`MutationObserverOptions`](MutationObserverOptions.md).[`mutationKey`](MutationObserverOptions.md#mutationkey)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:1212](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1212)

#### Inherited from

[`MutationObserverOptions`](MutationObserverOptions.md).[`networkMode`](MutationObserverOptions.md#networkmode)

***

### onError()?

```ts
optional onError: (error, variables, onMutateResult, context) => unknown;
```

Defined in: [packages/query-core/src/types.ts:1197](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1197)

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

Defined in: [packages/query-core/src/types.ts:1187](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1187)

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

Defined in: [packages/query-core/src/types.ts:1203](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1203)

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

Defined in: [packages/query-core/src/types.ts:1191](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1191)

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

Defined in: [packages/query-core/src/types.ts:1210](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1210)

#### Inherited from

```ts
OmitKeyof.retry
```

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1211](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1211)

#### Inherited from

```ts
OmitKeyof.retryDelay
```

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: [packages/query-core/src/types.ts:1217](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1217)

#### Inherited from

[`MutationObserverOptions`](MutationObserverOptions.md).[`scope`](MutationObserverOptions.md#scope)

***

### throwOnError?

```ts
optional throwOnError: boolean | (error) => boolean;
```

Defined in: [packages/query-core/src/types.ts:1226](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1226)

#### Inherited from

```ts
OmitKeyof.throwOnError
```
