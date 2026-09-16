---
id: CreateBaseQueryResult
title: CreateBaseQueryResult
---

```ts
type CreateBaseQueryResult<TData, TError, TState> = BaseQueryNarrowing<TData, TError> & MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">, MethodKeys<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">>>;
```

Defined in: [packages/angular-query/src/types.ts:191](https://github.com/TanStack/query/blob/main/packages/angular-query/src/types.ts#L191)

## Type Parameters

### TData

`TData` = `unknown`

The type `data` ends up as after `select` runs.

### TError

`TError` = [`DefaultError`](DefaultError.md)

The type of errors your `queryFn` may throw.

### TState

`TState` *extends* `QueryObserverResult`\<`TData`, `TError`\> = `QueryObserverResult`\<`TData`, `TError`\>
