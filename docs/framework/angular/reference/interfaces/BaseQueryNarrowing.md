---
id: BaseQueryNarrowing
title: BaseQueryNarrowing
---

Defined in: [types.ts:83](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L83)

The `isSuccess`/`isError`/`isPending` methods on a query result. Unlike `react-query`'s derived booleans,
these are type-guard methods you call — `if (query.isSuccess())` — so that `query.data` narrows away
`undefined` inside the branch, the same way `status` narrowing works on the plain object `react-query`
returns.

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = `DefaultError`

The type of errors your `queryFn` may throw.

## Properties

### isError()

```ts
isError: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>;
```

Defined in: [types.ts:91](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L91)

#### Parameters

##### this

[`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>`

***

### isPending()

```ts
isPending: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>;
```

Defined in: [types.ts:98](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L98)

#### Parameters

##### this

[`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>`

***

### isSuccess()

```ts
isSuccess: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>;
```

Defined in: [types.ts:84](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L84)

#### Parameters

##### this

[`CreateBaseQueryResult`](../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>`
