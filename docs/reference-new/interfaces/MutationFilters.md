---
id: MutationFilters
title: MutationFilters
---

# Interface: MutationFilters\<TData, TError, TVariables, TOnMutateResult\>

Defined in: [packages/query-core/src/utils.ts:57](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L57)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Properties

### exact?

```ts
optional exact: boolean;
```

Defined in: [packages/query-core/src/utils.ts:66](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L66)

Match mutation key exactly

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/utils.ts:76](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L76)

Include mutations matching this mutation key

***

### predicate()?

```ts
optional predicate: (mutation) => boolean;
```

Defined in: [packages/query-core/src/utils.ts:70](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L70)

Include mutations matching this predicate function

#### Parameters

##### mutation

[`Mutation`](../classes/Mutation.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`boolean`

***

### status?

```ts
optional status: MutationStatus;
```

Defined in: [packages/query-core/src/utils.ts:80](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L80)

Filter by mutation status
