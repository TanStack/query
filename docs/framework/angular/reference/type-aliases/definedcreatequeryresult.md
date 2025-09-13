---
id: DefinedCreateQueryResult
title: DefinedCreateQueryResult
---

# Type Alias: DefinedCreateQueryResult\<TData, TError, TState\>

```ts
type DefinedCreateQueryResult<TData, TError, TState> = BaseQueryNarrowing<
  TData,
  TError
> &
  MapToSignals<OmitKeyof<TState, keyof BaseQueryNarrowing, 'safely'>>
```

## Type Parameters

• **TData** = `unknown`

• **TError** = `DefaultError`

• **TState** = `DefinedQueryObserverResult`\<`TData`, `TError`\>

## Defined in

[types.ts:135](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/types.ts#L135)
