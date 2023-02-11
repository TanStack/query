---
id: useMutation
title: useMutation
---

```tsx
const {
  data,
  error,
  isError,
  isIdle,
  isLoading,
  isPaused,
  isSuccess,
  failureCount,
  failureReason,
  mutate,
  mutateAsync,
  reset,
  status,
} = useMutation({
  mutationFn,
  cacheTime,
  mutationKey,
  networkMode,
  onError,
  onMutate,
  onSettled,
  onSuccess,
  retry,
  retryDelay,
  useErrorBoundary,
  meta
})

mutate(variables, {
  onError,
  onSettled,
  onSuccess,
})
```

**Options**

- `mutationFn: (variables: TVariables) => Promise<TData>`
  - **Required, but only if no default mutation function has been defined**
  - A function that performs an asynchronous task and returns a promise.
  - `variables` is an object that `mutate` will pass to your `mutationFn`
- `cacheTime: number | Infinity`
  - The time in milliseconds that unused/inactive cache data remains in memory. When a mutation's cache becomes unused or inactive, that cache data will be garbage collected after this duration. When different cache times are specified, the longest one will be used.
  - If set to `Infinity`, will disable garbage collection
- `mutationKey: string`
  - Optional
  - A mutation key can be set to inherit defaults set with `queryClient.setMutationDefaults` or to identify the mutation in the devtools.
- `networkMode: 'online' | 'always' | 'offlineFirst`
  - optional
  - defaults to `'online'`
  - see [Network Mode](../guides/network-mode) for more information.
- `onMutate: (variables: TVariables) => Promise<TContext | void> | TContext | void`
  - Optional
  - This function will fire before the mutation function is fired and is passed the same variables the mutation function would receive
  - Useful to perform optimistic updates to a resource in hopes that the mutation succeeds
  - The value returned from this function will be passed to both the `onError` and `onSettled` functions in the event of a mutation failure and can be useful for rolling back optimistic updates.
- `onSuccess: (data: TData, variables: TVariables, context?: TContext) => Promise<unknown> | unknown`
  - Optional
  - This function will fire when the mutation is successful and will be passed the mutation's result.
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onError: (err: TError, variables: TVariables, context?: TContext) => Promise<unknown> | unknown`
  - Optional
  - This function will fire if the mutation encounters an error and will be passed the error.
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onSettled: (data: TData, error: TError, variables: TVariables, context?: TContext) => Promise<unknown> | unknown`
  - Optional
  - This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error
  - If a promise is returned, it will be awaited and resolved before proceeding
- `retry: boolean | number | (failureCount: number, error: TError) => boolean`
  - Defaults to `0`.
  - If `false`, failed mutations will not retry.
  - If `true`, failed mutations will retry infinitely.
  - If set to an `number`, e.g. `3`, failed mutations will retry until the failed mutations count meets that number.
- `retryDelay: number | (retryAttempt: number, error: TError) => number`
  - This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the next attempt in milliseconds.
  - A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential backoff.
  - A function like `attempt => attempt * 1000` applies linear backoff.
- `useErrorBoundary: undefined | boolean | (error: TError) => boolean`
  - Defaults to the global query config's `useErrorBoundary` value, which is `undefined`
  - Set this to `true` if you want mutation errors to be thrown in the render phase and propagate to the nearest error boundary
  - Set this to `false` to disable the behavior of throwing errors to the error boundary.
  - If set to a function, it will be passed the error and should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`)
- `meta: Record<string, unknown>`
  - Optional
  - If set, stores additional information on the mutation cache entry that can be used as needed. It will be accessible wherever the `mutation` is available (eg. `onError`, `onSuccess` functions of the `MutationCache`).
- `context?: React.Context<QueryClient | undefined>`
  - Use this to use a custom React Query context. Otherwise, `defaultContext` will be used.

**Returns**

- `mutate: (variables: TVariables, { onSuccess, onSettled, onError }) => void`
  - The mutation function you can call with variables to trigger the mutation and optionally hooks on additional callback options.
  - `variables: TVariables`
    - Optional
    - The variables object to pass to the `mutationFn`.
  - `onSuccess: (data: TData, variables: TVariables, context: TContext) => void`
    - Optional
    - This function will fire when the mutation is successful and will be passed the mutation's result.
    - Void function, the returned value will be ignored
  - `onError: (err: TError, variables: TVariables, context: TContext | undefined) => void`
    - Optional
    - This function will fire if the mutation encounters an error and will be passed the error.
    - Void function, the returned value will be ignored
  - `onSettled: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => void`
    - Optional
    - This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error
    - Void function, the returned value will be ignored
  - If you make multiple requests, `onSuccess` will fire only after the latest call you've made.
- `mutateAsync: (variables: TVariables, { onSuccess, onSettled, onError }) => Promise<TData>`
  - Similar to `mutate` but returns a promise which can be awaited.
- `status: string`
  - Will be:
    - `idle` initial status prior to the mutation function executing.
    - `loading` if the mutation is currently executing.
    - `error` if the last mutation attempt resulted in an error.
    - `success` if the last mutation attempt was successful.
- `isIdle`, `isLoading`, `isSuccess`, `isError`: boolean variables derived from `status`
- `isPaused: boolean`
  - will be `true` if the mutation has been `paused`
  - see [Network Mode](../guides/network-mode) for more information.
- `data: undefined | unknown`
  - Defaults to `undefined`
  - The last successfully resolved data for the query.
- `error: null | TError`
  - The error object for the query, if an error was encountered.
- `reset: () => void`
  - A function to clean the mutation internal state (i.e., it resets the mutation to its initial state).
- `failureCount: number`
  - The failure count for the mutation.
  - Incremented every time the mutation fails.
  - Reset to `0` when the mutation succeeds.
- `failureReason: null | TError`
  - The failure reason for the mutation retry.
  - Reset to `null` when the mutation succeeds.

