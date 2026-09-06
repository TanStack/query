---
id: MutationFilters
title: MutationFilters
---

Defined in: [packages/query-core/src/utils.ts:62](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L62)

Filters used to select mutations, for example in `mutationCache.findAll` or `queryClient.isMutating`.
All provided filters must match; filters that are left unspecified are ignored.

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

Defined in: [packages/query-core/src/utils.ts:71](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L71)

Match mutation key exactly

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/utils.ts:81](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L81)

Include mutations matching this mutation key

***

### predicate()?

```ts
optional predicate: (mutation) => boolean;
```

Defined in: [packages/query-core/src/utils.ts:75](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L75)

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

Defined in: [packages/query-core/src/utils.ts:85](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L85)

Filter by mutation status
