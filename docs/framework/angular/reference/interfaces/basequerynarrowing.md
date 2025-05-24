---
id: BaseQueryNarrowing
title: BaseQueryNarrowing
---

# Interface: BaseQueryNarrowing\<TData, TError\>

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

## Properties

### isError()

```ts
isError: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>;
```

#### Parameters

##### this

[`CreateBaseQueryResult`](../../type-aliases/createbasequeryresult.md)\<`TData`, `TError`, `QueryObserverResult`\<`TData`, `TError`\>\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>`

#### Defined in

[types.ts:76](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L76)

***

### isPending()

```ts
isPending: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>;
```

#### Parameters

##### this

[`CreateBaseQueryResult`](../../type-aliases/createbasequeryresult.md)\<`TData`, `TError`, `QueryObserverResult`\<`TData`, `TError`\>\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>`

#### Defined in

[types.ts:83](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L83)

***

### isSuccess()

```ts
isSuccess: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>;
```

#### Parameters

##### this

[`CreateBaseQueryResult`](../../type-aliases/createbasequeryresult.md)\<`TData`, `TError`, `QueryObserverResult`\<`TData`, `TError`\>\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>`

#### Defined in

[types.ts:69](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L69)
