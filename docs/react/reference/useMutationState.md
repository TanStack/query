---
id: useMutationState
title: useMutationState
---

`useMutationState` is a hook that gives you access to all mutations in the `MutationCache`. You can pass `filters` to it to narrow down your mutations, and `select` to transform the mutation state.

```tsx
import { useMutationState } from '@tanstack/react-query'
// Get all variables of all running mutations
const variables = useMutationState({
  filters: { status: 'pending' },
  select: (mutation) => mutation.state.variables,
})

// Get all data of all "post" mutations
const data = useMutationState({
  filters: { mutationKey: ['posts'] },
  select: (mutation) => mutation.state.data,
})
```

**Options**

- `options`
  - `filters?: MutationFilters`: [Mutation Filters](../guides/filters#mutation-filters)
  - `select?: (mutation: Mutation) => TResult`
    - Use this to transform the mutation state.
- `queryClient?: QueryClient`,
  - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will be used.

**Returns**

- `Array<TResult>`
  - Will be an Array of whatever `select` returns for each matching mutation.
