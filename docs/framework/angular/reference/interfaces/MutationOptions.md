---
id: MutationOptions
title: MutationOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:725

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:735

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:738

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:726

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:727

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:734

***

### onError()?

```ts
optional onError: (error, variables, onMutateResult, context) => unknown;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:730

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:728

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:731

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:729

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:732

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:733

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:739
