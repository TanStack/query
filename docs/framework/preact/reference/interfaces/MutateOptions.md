---
id: MutateOptions
title: MutateOptions
---

Defined in: [packages/query-core/src/types.ts:1264](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1264)

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

Defined in: [packages/query-core/src/types.ts:1276](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1276)

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

Defined in: [packages/query-core/src/types.ts:1282](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1282)

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

Defined in: [packages/query-core/src/types.ts:1270](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1270)

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
