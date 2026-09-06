---
id: MutationObserverOptions
title: MutationObserverOptions
---

Defined in: [packages/query-core/src/types.ts:1207](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1207)

## Extends

- [`MutationOptions`](MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

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

Defined in: [packages/query-core/src/types.ts:1200](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1200)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`gcTime`](MutationOptions.md#gctime)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1203](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1203)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`meta`](MutationOptions.md#meta)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: [packages/query-core/src/types.ts:1172](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1172)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`mutationFn`](MutationOptions.md#mutationfn)

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/types.ts:1173](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1173)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`mutationKey`](MutationOptions.md#mutationkey)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:1199](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1199)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`networkMode`](MutationOptions.md#networkmode)

***

### onError()?

```ts
optional onError: (error, variables, onMutateResult, context) => unknown;
```

Defined in: [packages/query-core/src/types.ts:1184](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1184)

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

[`MutationOptions`](MutationOptions.md).[`onError`](MutationOptions.md#onerror)

***

### onMutate()?

```ts
optional onMutate: (variables, context) => TOnMutateResult | Promise<TOnMutateResult>;
```

Defined in: [packages/query-core/src/types.ts:1174](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1174)

#### Parameters

##### variables

`TVariables`

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`TOnMutateResult` \| `Promise`\<`TOnMutateResult`\>

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`onMutate`](MutationOptions.md#onmutate)

***

### onSettled()?

```ts
optional onSettled: (data, error, variables, onMutateResult, context) => unknown;
```

Defined in: [packages/query-core/src/types.ts:1190](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1190)

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

[`MutationOptions`](MutationOptions.md).[`onSettled`](MutationOptions.md#onsettled)

***

### onSuccess()?

```ts
optional onSuccess: (data, variables, onMutateResult, context) => unknown;
```

Defined in: [packages/query-core/src/types.ts:1178](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1178)

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

[`MutationOptions`](MutationOptions.md).[`onSuccess`](MutationOptions.md#onsuccess)

***

### retry?

```ts
optional retry: RetryValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1197](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1197)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`retry`](MutationOptions.md#retry)

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1198](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1198)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`retryDelay`](MutationOptions.md#retrydelay)

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: [packages/query-core/src/types.ts:1204](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1204)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`scope`](MutationOptions.md#scope)

***

### throwOnError?

```ts
optional throwOnError: boolean | (error) => boolean;
```

Defined in: [packages/query-core/src/types.ts:1213](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1213)
