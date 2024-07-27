---
id: CreateBaseQueryResult
title: CreateBaseQueryResult
---

# Type Alias: CreateBaseQueryResult\<TData, TError, TState\>

```ts
type CreateBaseQueryResult<TData, TError, TState>: BaseQueryNarrowing<TData, TError> & MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">>;
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TState** = `QueryObserverResult`\<`TData`, `TError`\>

## Defined in

[types.ts:116](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/types.ts#L116)
