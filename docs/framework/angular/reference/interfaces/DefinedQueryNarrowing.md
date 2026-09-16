---
id: DefinedQueryNarrowing
title: DefinedQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:90](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L90)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

## Properties

### isError

```ts
isError: SignalFunction<(this) => this is DefinedCreateQueryResult<TData, TError, QueryObserverRefetchErrorResult<TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:100](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L100)

***

### isPending

```ts
isPending: SignalFunction<(this) => this is never>;
```

Defined in: [packages/angular-query/src/types.ts:109](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L109)

***

### isSuccess

```ts
isSuccess: SignalFunction<(this) => this is DefinedCreateQueryResult<TData, TError, QueryObserverSuccessResult<TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:91](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L91)
