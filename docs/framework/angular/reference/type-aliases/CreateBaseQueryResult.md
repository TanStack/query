---
id: CreateBaseQueryResult
title: CreateBaseQueryResult
---

# Type Alias: CreateBaseQueryResult\<TData, TError, TState\>

```ts
type CreateBaseQueryResult<TData, TError, TState> = BaseQueryNarrowing<TData, TError> & MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">, MethodKeys<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">>>;
```

Defined in: [types.ts:86](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L86)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TState

`TState` = `QueryObserverResult`\<`TData`, `TError`\>
