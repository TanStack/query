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

The `useSequentialMutations` hook accepts an options object with a **mutations** key whose value is an array of mutation configs identical to the [`useMutation` hook](../useMutation.md) (excluding the `queryClient` option - because the `QueryClient` can be passed as the second argument).

- `queryClient?: QueryClient`
  - Custom `QueryClient`. Otherwise, the one from context will be used.
- `mutations: ReadonlyArray<SequentialMutationConfig>`
  - Each entry contains `options` for a mutation.
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

The `useSequentialMutations` hook returns per-step mutation results alongside progress state and imperative helpers.

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
  currentIndex: number // -1 when idle
  isLoading: boolean
  error: unknown | null
  reset: () => void
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
  ) => Promise<Array<unknown>> // With stopOnError=false, errors are included in the array
}
```

> Mutate options passed at call-time use the same shape as [`mutationOptions`](./mutationOptions.md) / `useMutation`’s `mutate` options.

### Variable passing

- First step receives the `input` you pass to `mutate`/`mutateAsync`.
- Each subsequent step receives the previous step’s resolved data as its variables.

```tsx
const { mutateAsync } = useSequentialMutations({
  mutations: [
    { options: { mutationFn: async (v) => `s1:${String(v)}` } },
    { options: { mutationFn: async (v) => `s2:${String(v)}` } },
    { options: { mutationFn: async (v) => `s3:${String(v)}` } },
  ],
})

const outputs = await mutateAsync('X')
// ['s1:X', 's2:s1:X', 's3:s2:s1:X']
```

### Call-time per-step mutate options

You can provide per-step mutate options at call time, either as an array (by index) or via a function mapper.

```tsx
// by index (array)
const { mutateAsync } = useSequentialMutations({
  mutations: [
    { options: { mutationFn: async (name: string) => `u:${name}` } },
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
    { options: { mutationFn: async (v: string) => `a:${v}` } },
    { options: { mutationFn: async (v: string) => `b:${v}` } },
  ],
})

await mutateAsync('X', (index) => ({
  onSuccess: (data) => console.log(`ok${index}:${data}`),
}))
```

> First step receives `input`; subsequent steps receive the previous step’s result by default.

### Error policy

```tsx
const { mutateAsync } = useSequentialMutations({
  mutations,
  stopOnError: false,
})

const outputs = await mutateAsync()
// e.g. [ResultStep1, ErrorStep2, ResultStep3]
```

### Progress state

The hook exposes simple progress state to improve UX:

- `currentIndex`: currently running step index (−1 when idle)
- `isLoading`: whether the overall sequence is running
- `error`: last error when `stopOnError=true` aborted the sequence
- `reset()`: abort in-flight work and reset state to idle

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


