---
id: MutationObserverOptions
title: MutationObserverOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:728

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:722

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`gcTime`](MutationOptions.md#gctime)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:725

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`meta`](MutationOptions.md#meta)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:713

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`mutationFn`](MutationOptions.md#mutationfn)

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:714

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`mutationKey`](MutationOptions.md#mutationkey)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:721

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`networkMode`](MutationOptions.md#networkmode)

***

### onError()?

```ts
optional onError: (error, variables, onMutateResult, context) => unknown;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:717

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:715

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:718

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:716

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:719

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`retry`](MutationOptions.md#retry)

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:720

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`retryDelay`](MutationOptions.md#retrydelay)

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:726

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`scope`](MutationOptions.md#scope)

***

### throwOnError?

```ts
optional throwOnError: boolean | (error) => boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:729
