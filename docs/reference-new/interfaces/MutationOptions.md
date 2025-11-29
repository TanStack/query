---
id: MutationOptions
title: MutationOptions
---

# Interface: MutationOptions\<TData, TError, TVariables, TOnMutateResult\>

Defined in: [packages/query-core/src/types.ts:1105](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1105)

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

### \_defaulted?

```ts
optional _defaulted: boolean;
```

Defined in: [packages/query-core/src/types.ts:1140](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1140)

***

### gcTime?

```ts
optional gcTime: number;
```

Defined in: [packages/query-core/src/types.ts:1139](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1139)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1141](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1141)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: [packages/query-core/src/types.ts:1111](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1111)

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/types.ts:1112](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1112)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:1138](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1138)

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

***

### retry?

```ts
optional retry: RetryValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1136](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1136)

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1137](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1137)

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: [packages/query-core/src/types.ts:1142](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1142)
