---
id: useMutationState
title: useMutationState
---

```ts
function useMutationState<TResult, TMutation>(options, queryClient?): TResult[];
```

Defined in: [preact-query/src/useMutationState.ts:123](https://github.com/TanStack/query/blob/main/packages/preact-query/src/useMutationState.ts#L123)

`useMutationState` is a hook that gives you access to all mutations in the `MutationCache`. You can pass
`filters` to it to narrow down your mutations, and `select` to transform the mutation state.

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

Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
be used.

## Returns

`TResult`[]

Will be an Array of whatever `select` returns for each matching mutation.

## Examples

Get all variables of all running mutations:
```tsx
import { useMutationState } from '@tanstack/preact-query'

const variables = useMutationState({
  filters: { status: 'pending' },
  select: (mutation) => mutation.state.variables,
})
```

Get all data for specific mutations via the `mutationKey`:
```tsx
import { useMutation, useMutationState } from '@tanstack/preact-query'

const mutationKey = ['posts']

// Some mutation that we want to get the state for
const mutation = useMutation({
  mutationKey,
  mutationFn: createPosts,
})

const data = useMutationState({
  // this mutation key needs to match the mutation key of the given mutation (see above)
  filters: { mutationKey },
  select: (mutation) => mutation.state.data,
})
```
