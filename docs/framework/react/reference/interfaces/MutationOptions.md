---
id: MutationOptions
title: MutationOptions
---

Defined in: [packages/query-core/src/types.ts:1179](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1179)

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

Defined in: [packages/query-core/src/types.ts:1213](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1213)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: [packages/query-core/src/types.ts:1216](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1216)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: [packages/query-core/src/types.ts:1185](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1185)

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/types.ts:1186](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1186)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: [packages/query-core/src/types.ts:1212](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1212)

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

***

### retry?

```ts
optional retry: RetryValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1210](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1210)

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: [packages/query-core/src/types.ts:1211](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1211)

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: [packages/query-core/src/types.ts:1217](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1217)
