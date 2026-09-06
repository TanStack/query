---
id: CreateMutationOptions
title: CreateMutationOptions
---

Defined in: [packages/angular-query-experimental/src/types.ts:224](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L224)

The options accepted by `injectMutation`. Same as [MutationObserverOptions](MutationObserverOptions.md) from
`@tanstack/query-core`, minus the internal `_defaulted` flag.

## Extends

- [`OmitKeyof`](../type-aliases/OmitKeyof.md)\<[`MutationObserverOptions`](MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"_defaulted"`\>

## Type Parameters

### TData

`TData` = `unknown`

The type your mutation function resolves to.

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The type of errors your mutation function may throw.

### TVariables

`TVariables` = `void`

The type of the variable passed to `mutate`/`mutateAsync`.

### TOnMutateResult

`TOnMutateResult` = `unknown`

The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
their `onMutateResult` parameter — useful for optimistic-update rollback data.

## Properties

### gcTime?

```ts
optional gcTime: number;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:735

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`gcTime`](MutationOptions.md#gctime)

***

### meta?

```ts
optional meta: Record<string, unknown>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:738

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`meta`](MutationOptions.md#meta)

***

### mutationFn?

```ts
optional mutationFn: MutationFunction<TData, TVariables>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:726

#### Inherited from

```ts
OmitKeyof.mutationFn
```

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:727

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`mutationKey`](MutationOptions.md#mutationkey)

***

### networkMode?

```ts
optional networkMode: NetworkMode;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:734

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`networkMode`](MutationOptions.md#networkmode)

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

#### Inherited from

```ts
OmitKeyof.onError
```

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

#### Inherited from

```ts
OmitKeyof.onMutate
```

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

#### Inherited from

```ts
OmitKeyof.onSettled
```

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

#### Inherited from

```ts
OmitKeyof.onSuccess
```

***

### retry?

```ts
optional retry: RetryValue<TError>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:732

#### Inherited from

```ts
OmitKeyof.retry
```

***

### retryDelay?

```ts
optional retryDelay: RetryDelayValue<TError>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:733

#### Inherited from

```ts
OmitKeyof.retryDelay
```

***

### scope?

```ts
optional scope: MutationScope;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:739

#### Inherited from

[`MutationOptions`](MutationOptions.md).[`scope`](MutationOptions.md#scope)

***

### throwOnError?

```ts
optional throwOnError: boolean | (error) => boolean;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:742

#### Inherited from

```ts
OmitKeyof.throwOnError
```
