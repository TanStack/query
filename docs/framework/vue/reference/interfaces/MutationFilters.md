---
id: MutationFilters
title: MutationFilters
---

Defined in: [packages/query-core/src/utils.ts:64](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L64)

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

Defined in: [packages/query-core/src/utils.ts:73](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L73)

Match mutation key exactly

***

### mutationKey?

```ts
optional mutationKey: readonly unknown[];
```

Defined in: [packages/query-core/src/utils.ts:83](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L83)

Include mutations matching this mutation key

***

### predicate()?

```ts
optional predicate: (mutation) => boolean;
```

Defined in: [packages/query-core/src/utils.ts:77](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L77)

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

Defined in: [packages/query-core/src/utils.ts:87](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L87)

Filter by mutation status
