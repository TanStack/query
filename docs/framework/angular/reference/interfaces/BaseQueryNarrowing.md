---
id: BaseQueryNarrowing
title: BaseQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:60](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L60)

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

The type of errors your `queryFn` may throw.

## Properties

### isError

```ts
isError: SignalFunction<(this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"error", TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:70](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L70)

***

### isPending

```ts
isPending: SignalFunction<(this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"pending", TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:79](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L79)

***

### isSuccess

```ts
isSuccess: SignalFunction<(this) => this is CreateBaseQueryResult<TData, TError, CreateStatusBasedQueryResult<"success", TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:61](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L61)
