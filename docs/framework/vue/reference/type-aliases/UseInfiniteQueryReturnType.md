---
id: UseInfiniteQueryReturnType
title: UseInfiniteQueryReturnType
---

```ts
type UseInfiniteQueryReturnType<TData, TError> = UseBaseQueryReturnType<TData, TError, InfiniteQueryObserverResult<TData, TError>>;
```

Defined in: [packages/vue-query/src/useInfiniteQuery.ts:74](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useInfiniteQuery.ts#L74)

The result of `useInfiniteQuery`: [InfiniteQueryObserverResult](InfiniteQueryObserverResult.md) from `@tanstack/query-core`, with
its properties wrapped in `Ref`s as in UseBaseQueryReturnType.

## Type Parameters

### TData

`TData`

### TError

`TError`
