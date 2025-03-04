---
id: useMutationState
title: useMutationState
---

`useMutationState` is a hook that gives you access to all mutations in the `MutationCache`. You can pass `filters` to it to narrow down your mutations, and `select` to transform the mutation state.

**Example 1: Get all variables of all running mutations**

```tsx
import { useMutationState } from '@tanstack/react-query'

const variables = useMutationState({
  filters: { status: 'pending' },
  select: (mutation) => mutation.state.variables,
})
```

**Example 2: Get all data for specific mutations via the `mutationKey`**

```tsx
import { useMutation, useMutationState } from '@tanstack/react-query'

const mutationKey = ['posts']

// Some mutation that we want to get the state for
const mutation = useMutation({
  mutationKey,
  mutationFn: (newPost) => {
    return axios.post('/posts', newPost)
  },
})

const data = useMutationState({
  // this mutation key needs to match the mutation key of the given mutation (see above)
  filters: { mutationKey },
  select: (mutation) => mutation.state.data,
})
```

**Example 3: Access the latest mutation data via the `mutationKey`**
Each invocation of `mutate` adds a new entry to the mutation cache for `gcTime` milliseconds.

To access the latest invocation, you can check for the last item that `useMutationState` returns.

```tsx
import { useMutation, useMutationState } from '@tanstack/react-query'

const mutationKey = ['posts']

// Some mutation that we want to get the state for
const mutation = useMutation({
  mutationKey,
  mutationFn: (newPost) => {
    return axios.post('/posts', newPost)
  },
})

const data = useMutationState({
  // this mutation key needs to match the mutation key of the given mutation (see above)
  filters: { mutationKey },
  select: (mutation) => mutation.state.data,
})

// Latest mutation data
const latest = data[data.length - 1]
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
