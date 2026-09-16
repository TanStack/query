---
id: DefinedInfiniteQueryNarrowing
title: DefinedInfiniteQueryNarrowing
---

Defined in: [packages/angular-query/src/types.ts:147](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L147)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

## Properties

### isError

```ts
isError: SignalFunction<(this) => this is DefinedCreateInfiniteQueryResult<TData, TError, InfiniteQueryObserverRefetchErrorResult<TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:160](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L160)

***

### isPending

```ts
isPending: SignalFunction<(this) => this is never>;
```

Defined in: [packages/angular-query/src/types.ts:169](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L169)

***

### isSuccess

```ts
isSuccess: SignalFunction<(this) => this is DefinedCreateInfiniteQueryResult<TData, TError, InfiniteQueryObserverSuccessResult<TData, TError>>>;
```

Defined in: [packages/angular-query/src/types.ts:151](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L151)
