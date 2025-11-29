---
id: BaseQueryNarrowing
title: BaseQueryNarrowing
---

# Interface: BaseQueryNarrowing\<TData, TError\>

Defined in: [types.ts:57](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L57)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

## Properties

### isError()

```ts
isError: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>;
```

Defined in: [types.ts:65](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L65)

#### Parameters

##### this

[`CreateBaseQueryResult`](../../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>`

***

### isPending()

```ts
isPending: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>;
```

Defined in: [types.ts:72](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L72)

#### Parameters

##### this

[`CreateBaseQueryResult`](../../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>`

***

### isSuccess()

```ts
isSuccess: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>;
```

Defined in: [types.ts:58](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L58)

#### Parameters

##### this

[`CreateBaseQueryResult`](../../type-aliases/CreateBaseQueryResult.md)\<`TData`, `TError`\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>`
