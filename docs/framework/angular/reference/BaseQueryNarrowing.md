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

• **this**: [`CreateBaseQueryResult`](CreateBaseQueryResult.md)\<`TData`, `TError`, `QueryObserverResult`\<`TData`, `TError`\>\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>`

#### Defined in

[types.ts:75](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/types.ts#L75)

---

### isPending()

```ts
isPending: (this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>;
```

#### Parameters

• **this**: [`CreateBaseQueryResult`](CreateBaseQueryResult.md)\<`TData`, `TError`, `QueryObserverResult`\<`TData`, `TError`\>\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>`

#### Defined in

[types.ts:82](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/types.ts#L82)

---

### isSuccess()

```ts
isSuccess: (this) => this is CreateBaseQueryResult<TData, TError, QueryObserverSuccessResult<TData, TError>>;
```

#### Parameters

• **this**: [`CreateBaseQueryResult`](CreateBaseQueryResult.md)\<`TData`, `TError`, `QueryObserverResult`\<`TData`, `TError`\>\>

#### Returns

`this is CreateBaseQueryResult<TData, TError, QueryObserverSuccessResult<TData, TError>>`

#### Defined in

[types.ts:68](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/types.ts#L68)
