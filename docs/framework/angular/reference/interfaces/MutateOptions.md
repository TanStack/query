---
id: MutateOptions
title: MutateOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:731

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:733

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:734

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

Defined in: packages/query-core/dist-ts/src/types.d.ts:732

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
