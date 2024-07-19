---
id: BaseMutationNarrowing
title: BaseMutationNarrowing
---

# Interface: BaseMutationNarrowing\<TData, TError, TVariables, TContext\>

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TVariables** = `unknown`

• **TContext** = `unknown`

## Properties

### isError()

```ts
isError: (this) => this is CreateMutationResult<TData, TError, TVariables, TContext, Override<MutationObserverErrorResult<TData, TError, TVariables, TContext>, Object> & Object>;
```

#### Parameters

• **this**: [`CreateMutationResult`](CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TContext`, `CreateStatusBasedMutationResult`\<`"error"` \| `"success"` \| `"pending"` \| `"idle"`, `TData`, `TError`, `TVariables`, `TContext`\>\>

#### Returns

`this is CreateMutationResult<TData, TError, TVariables, TContext, Override<MutationObserverErrorResult<TData, TError, TVariables, TContext>, Object> & Object>`

#### Defined in

[types.ts:248](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/types.ts#L248)

---

### isIdle()

```ts
isIdle: (this) => this is CreateMutationResult<TData, TError, TVariables, TContext, Override<MutationObserverIdleResult<TData, TError, TVariables, TContext>, Object> & Object>;
```

#### Parameters

• **this**: [`CreateMutationResult`](CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TContext`, `CreateStatusBasedMutationResult`\<`"error"` \| `"success"` \| `"pending"` \| `"idle"`, `TData`, `TError`, `TVariables`, `TContext`\>\>

#### Returns

`this is CreateMutationResult<TData, TError, TVariables, TContext, Override<MutationObserverIdleResult<TData, TError, TVariables, TContext>, Object> & Object>`

#### Defined in

[types.ts:278](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/types.ts#L278)

---

### isPending()

```ts
isPending: (this) => this is CreateMutationResult<TData, TError, TVariables, TContext, Override<MutationObserverLoadingResult<TData, TError, TVariables, TContext>, Object> & Object>;
```

#### Parameters

• **this**: [`CreateMutationResult`](CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TContext`, `CreateStatusBasedMutationResult`\<`"error"` \| `"success"` \| `"pending"` \| `"idle"`, `TData`, `TError`, `TVariables`, `TContext`\>\>

#### Returns

`this is CreateMutationResult<TData, TError, TVariables, TContext, Override<MutationObserverLoadingResult<TData, TError, TVariables, TContext>, Object> & Object>`

#### Defined in

[types.ts:263](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/types.ts#L263)

---

### isSuccess()

```ts
isSuccess: (this) => this is CreateMutationResult<TData, TError, TVariables, TContext, Override<MutationObserverSuccessResult<TData, TError, TVariables, TContext>, Object> & Object>;
```

#### Parameters

• **this**: [`CreateMutationResult`](CreateMutationResult.md)\<`TData`, `TError`, `TVariables`, `TContext`, `CreateStatusBasedMutationResult`\<`"error"` \| `"success"` \| `"pending"` \| `"idle"`, `TData`, `TError`, `TVariables`, `TContext`\>\>

#### Returns

`this is CreateMutationResult<TData, TError, TVariables, TContext, Override<MutationObserverSuccessResult<TData, TError, TVariables, TContext>, Object> & Object>`

#### Defined in

[types.ts:233](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/types.ts#L233)
