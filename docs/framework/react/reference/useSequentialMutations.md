---
id: useSequentialMutations
title: useSequentialMutations
---

The `useSequentialMutations` hook can be used to run a variable number of mutations in series, passing each step’s result to the next step.

### Signature

```ts
useSequentialMutations(
  options: UseSequentialMutationsOptions,
  queryClient?: QueryClient,
): UseSequentialMutationsResult
```

### Usage

```tsx
const steps = [
  { options: { mutationFn: async () => 'a' } },
  { options: { mutationFn: async (v) => `b:${String(v)}` } },
  { options: { mutationFn: async (v) => `c:${String(v)}` } },
]

const results = useSequentialMutations({ mutations: steps })
```

**Options**

The `useSequentialMutations` hook accepts an options object with a **mutations** key whose value is an array with mutation option objects identical to the [`useMutation` hook](../useMutation.md) (excluding the `queryClient` option - because the `QueryClient` can be passed as the second argument).

- `queryClient?: QueryClient`
  - Use this to provide a custom QueryClient. Otherwise, the one from the nearest context will be used.
- `mutations: ReadonlyArray<SequentialMutationConfig>`
  - Each entry contains `options` for a mutation and an optional `getVariables` function to derive variables for that step.
- `stopOnError?: boolean`
  - `true` (default): throw on first error and stop the sequence. `false`: include the error in outputs and continue to the next step.

```ts
interface SequentialMutationConfig {
  options: UseMutationOptions<any, any, any, any>
  getVariables?: (ctx: {
    index: number
    input: unknown
    prevData: unknown
    allData: Array<unknown>
  }) => unknown | Promise<unknown>
}

interface UseSequentialMutationsOptions {
  mutations: ReadonlyArray<SequentialMutationConfig>
  stopOnError?: boolean
}
```

**Returns**

The `useSequentialMutations` hook returns an array with all the mutation results. The order returned is the same as the input order.

```ts
interface UseSequentialMutationsResult {
  results: Array<UseMutationResult<any, any, any, any>>
  mutate: (input?: unknown) => void
  mutateAsync: (input?: unknown) => Promise<Array<unknown>>
}
```

### Deriving variables per step

If you want to compute variables for each step from the input or from previous results, you can provide a `getVariables` function per step.

```tsx
const { mutateAsync } = useSequentialMutations({
  mutations: [
    {
      options: { mutationFn: async (v) => `s1:${String(v)}` },
      getVariables: ({ input }) => `in:${String(input)}`,
    },
    {
      options: { mutationFn: async (v) => `s2:${String(v)}` },
      getVariables: ({ prevData }) => `${String(prevData)}->s2`,
    },
    {
      options: { mutationFn: async (v) => `s3:${String(v)}` },
      getVariables: ({ allData }) => `${String(allData.at(-1))}->s3`,
    },
  ],
})

const outputs = await mutateAsync('X')
// ['s1:in:X', 's2:s1:in:X->s2', 's3:s2:s1:in:X->s2->s3']
```

### Error policy

```tsx
const { mutateAsync } = useSequentialMutations({
  mutations,
  stopOnError: false,
})

const outputs = await mutateAsync()
// e.g. [ResultStep1, ErrorStep2, ResultStep3]
```

### Memoization

The `mutations` array identity determines when observers and subscriptions might be updated. To avoid unnecessary work, consider providing a stable reference, e.g. via `useMemo`, especially if the array is constructed inline.

```tsx
const steps = React.useMemo(
  () => [
    { options: { mutationFn: async () => 'a' } },
    { options: { mutationFn: async (v) => `b:${String(v)}` } },
  ],
  [],
)

const { results } = useSequentialMutations({ mutations: steps })
```

### See also

- [`useMutation`](./useMutation.md)
- [`mutationOptions`](./mutationOptions.md)


