---
id: CreateBaseQueryResult
title: CreateBaseQueryResult
---

# Type Alias: CreateBaseQueryResult\<TData, TError, TState\>

```ts
type CreateBaseQueryResult<TData, TError, TState> = BaseQueryNarrowing<TData, TError> & MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, "safely">>;
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TState** = `QueryObserverResult`\<`TData`, `TError`\>

## Defined in

[types.ts:117](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L117)
