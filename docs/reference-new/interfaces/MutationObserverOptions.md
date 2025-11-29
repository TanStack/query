---
id: MutationObserverOptions
title: MutationObserverOptions
---

# Interface: MutationObserverOptions\<TData, TError, TVariables, TOnMutateResult\>

Defined in: [packages/query-core/src/types.ts:1145](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1145)

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

### \_defaulted?

```ts
optional _defaulted: boolean;
```

Defined in: [packages/query-core/src/types.ts:1140](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1140)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`_defaulted`](MutationOptions.md#_defaulted)

***

### gcTime?

```ts
optional gcTime: number;
```

Defined in: [packages/query-core/src/types.ts:1139](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1139)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`gcTime`](MutationOptions.md#gctime)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1141](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1141)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`meta`](MutationOptions.md#meta)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: [packages/query-core/src/types.ts:1111](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1111)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`mutationFn`](MutationOptions.md#mutationfn)

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/types.ts:1112](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1112)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`mutationKey`](MutationOptions.md#mutationkey)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:1138](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1138)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`networkMode`](MutationOptions.md#networkmode)

***

### onError()?

```ts
optional onError: (error, variables, onMutateResult, context) => unknown;
```

Defined in: [packages/query-core/src/types.ts:1123](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1123)

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

Defined in: [packages/query-core/src/types.ts:1113](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1113)

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

Defined in: [packages/query-core/src/types.ts:1129](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1129)

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

Defined in: [packages/query-core/src/types.ts:1117](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1117)

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

Defined in: [packages/query-core/src/types.ts:1136](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1136)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`retry`](MutationOptions.md#retry)

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1137](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1137)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`retryDelay`](MutationOptions.md#retrydelay)

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: [packages/query-core/src/types.ts:1142](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1142)

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`scope`](MutationOptions.md#scope)

***

### throwOnError?

```ts
optional throwOnError: boolean | (error) => boolean;
```

Defined in: [packages/query-core/src/types.ts:1151](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1151)
