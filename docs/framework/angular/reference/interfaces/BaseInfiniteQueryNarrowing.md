---
id: BaseInfiniteQueryNarrowing
title: BaseInfiniteQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:114](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L114)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

## Properties

### isError

```ts
isError: SignalFunction<(this) => this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"error", TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:127](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L127)

***

### isPending

```ts
isPending: SignalFunction<(this) => this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"pending", TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:136](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L136)

***

### isSuccess

```ts
isSuccess: SignalFunction<(this) => this is CreateInfiniteQueryResult<TData, TError, CreateStatusBasedInfiniteQueryResult<"success", TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:118](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L118)
