---
id: useMutationState
title: useMutationState
---

```ts
function useMutationState<TResult, TMutation>(options, queryClient?): TResult[];
```

Defined in: [preact-query/src/useMutationState.ts:63](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useMutationState.ts#L63)

## Type Parameters

### TResult

`TResult` = `MutationState`\<`unknown`, `Error`, `unknown`, `unknown`\>

### TMutation

`TMutation` *extends* `Mutation`\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Parameters

### options

`MutationStateOptions`\<`TResult`, `TMutation`\> = `{}`

### queryClient?

`QueryClient`

## Returns

`TResult`[]
