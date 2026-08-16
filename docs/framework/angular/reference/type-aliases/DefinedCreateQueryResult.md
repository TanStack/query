---
id: DefinedCreateQueryResult
title: DefinedCreateQueryResult
---

```ts
type DefinedCreateQueryResult<TData, TError, TState> = BaseQueryNarrowing<TData, TError> & MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">>;
```

Defined in: [types.ts:104](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L104)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = `DefaultError`

### TState

`TState` = `DefinedQueryObserverResult`\<`TData`, `TError`\>
