---
id: useSequentialMutations
title: useSequentialMutations
---

The `useSequentialMutations` hook can be used to run a variable number of mutations in series, passing each step’s result to the next step. It supports generics to type each step precisely and allows passing per-step mutate options at call time.

### Signature

```ts
useSequentialMutations<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>
>(
  options: UseSequentialMutationsOptions<TSteps>,
  queryClient?: QueryClient,
): UseSequentialMutationsResult<TSteps>
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
interface SequentialMutationConfig<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
> {
  options: UseMutationOptions<TData, TError, TVariables, TContext>
  getVariables?: (ctx: {
    index: number
    input: unknown
    prevData: unknown
    allData: Array<unknown>
  }) => TVariables | Promise<TVariables>
}

interface UseSequentialMutationsOptions<
  TSteps extends ReadonlyArray<
    SequentialMutationConfig<any, any, any, any>
  > = ReadonlyArray<SequentialMutationConfig<any, any, any, any>>,
> {
  mutations: TSteps
  stopOnError?: boolean
}
```

**Returns**

The `useSequentialMutations` hook returns an array with all the mutation results. The order returned is the same as the input order. Types are inferred per-step from the provided `SequentialMutationConfig` entries.

```ts
interface UseSequentialMutationsResult<
  TSteps extends ReadonlyArray<SequentialMutationConfig<any, any, any, any>>
> {
  results: {
    [K in keyof TSteps]: TSteps[K] extends SequentialMutationConfig<
      infer TData,
      infer TError,
      infer TVariables,
      infer TContext
    >
      ? UseMutationResult<TData, TError, TVariables, TContext>
      : never
  }
  mutate: (
    input?: unknown,
    stepOptions?:
      | Array<MutateOptions<any, any, any, any> | undefined>
      | ((index: number) => MutateOptions<any, any, any, any> | undefined),
  ) => void
  mutateAsync: (
    input?: unknown,
    stepOptions?:
      | Array<MutateOptions<any, any, any, any> | undefined>
      | ((index: number) => MutateOptions<any, any, any, any> | undefined),
  ) => Promise<Array<unknown>>
}
```

> Mutate options passed at call-time use the same shape as [`mutationOptions`](./mutationOptions.md) / `useMutation`’s `mutate` options.

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

### Call-time per-step mutate options

You can provide per-step mutate options at call time, either as an array (by index) or via a function mapper.

```tsx
// by index (array)
const { mutateAsync } = useSequentialMutations({
  mutations: [
    {
      options: { mutationFn: async (name: string) => `u:${name}` },
      getVariables: ({ input }) => String(input),
    },
    { options: { mutationFn: async () => Promise.reject(new Error('boom')) } },
  ],
  stopOnError: false,
})

const out = await mutateAsync('A', [
  { onSuccess: (data, variables) => console.log('step0 ok', data, variables) },
  { onError: (err) => console.log('step1 err', err) },
])
```

```tsx
// via function mapper
const { mutateAsync } = useSequentialMutations({
  mutations: [
    {
      options: { mutationFn: async (v: string) => `a:${v}` },
      getVariables: ({ input }) => String(input),
    },
    { options: { mutationFn: async (v: string) => `b:${v}` } },
  ],
})

await mutateAsync('X', (index) => ({
  onSuccess: (data) => console.log(`ok${index}:${data}`),
}))
```

> If `getVariables` is omitted for a step, the previous step’s result is passed as variables to the next step by default.

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


