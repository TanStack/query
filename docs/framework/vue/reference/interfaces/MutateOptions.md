---
id: MutateOptions
title: MutateOptions
---

Defined in: [packages/query-core/src/types.ts:1229](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1229)

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

### onError()?

```ts
optional onError: (error, variables, onMutateResult, context) => void;
```

Defined in: [packages/query-core/src/types.ts:1241](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1241)

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

`void`

***

### onSettled()?

```ts
optional onSettled: (data, error, variables, onMutateResult, context) => void;
```

Defined in: [packages/query-core/src/types.ts:1247](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1247)

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

`void`

***

### onSuccess()?

```ts
optional onSuccess: (data, variables, onMutateResult, context) => void;
```

Defined in: [packages/query-core/src/types.ts:1235](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1235)

#### Parameters

##### data

`TData`

##### variables

`TVariables`

##### onMutateResult

`TOnMutateResult` | `undefined`

##### context

[`MutationFunctionContext`](../type-aliases/MutationFunctionContext.md)

#### Returns

`void`
