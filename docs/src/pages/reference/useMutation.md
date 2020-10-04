---
id: useMutation
title: useMutation
---

```js
const {
  data,
  error,
  isError,
  isIdle,
  isLoading,
  isSuccess,
  mutate,
  mutateAsync,
  reset,
  status,
} = useMutation(mutationFn, {
  onError,
  onMutate,
  onSettled,
  onSuccess,
  useErrorBoundary,
})

mutate(variables, {
  onError,
  onSettled,
  onSuccess,
})
```

**Options**

- `mutationFn: (variables: TVariables) => Promise<TData>`
  - **Required**
  - A function that performs an asynchronous task and returns a promise.
  - `variables` is an object that `mutate` will pass to your `mutationFn`
- `onMutate: (variables: TVariables) => Promise<TContext | void> | TContext | void`
  - Optional
  - This function will fire before the mutation function is fired and is passed the same variables the mutation function would receive
  - Useful to perform optimistic updates to a resource in hopes that the mutation succeeds
  - The value returned from this function will be passed to both the `onError` and `onSettled` functions in the event of a mutation failure and can be useful for rolling back optimistic updates.
- `onSuccess: (data: TData, variables: TVariables, context: TContext) => Promise<void> | void`
  - Optional
  - This function will fire when the mutation is successful and will be passed the mutation's result.
  - Fires after the `mutate`-level `onSuccess` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onError: (err: TError, variables: TVariables, context?: TContext) => Promise<void> | void`
  - Optional
  - This function will fire if the mutation encounters an error and will be passed the error.
  - Fires after the `mutate`-level `onError` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `onSettled: (data: TData, error: TError, variables: TVariables, context?: TContext) => Promise<void> | void`
  - Optional
  - This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error
  - Fires after the `mutate`-level `onSettled` handler (if it is defined)
  - If a promise is returned, it will be awaited and resolved before proceeding
- `useErrorBoundary`
  - Defaults to the global query config's `useErrorBoundary` value, which is `false`
  - Set this to true if you want mutation errors to be thrown in the render phase and propagate to the nearest error boundary

**Returns**

- `mutate: (variables: TVariables, { onSuccess, onSettled, onError }) => void`
  - The mutation function you can call with variables to trigger the mutation and optionally override the original mutation options.
  - `variables: TVariables`
    - Optional
    - The variables object to pass to the `mutationFn`.
  - Remaining options extend the same options described above in the `useMutation` hook.
  - Lifecycle callbacks defined here will fire **after** those of the same type defined in the `useMutation`-level options.
- `mutateAsync: (variables: TVariables, { onSuccess, onSettled, onError }) => Promise<TData>`
  - Similar to `mutate` but returns a promise which can be awaited.
- `status: string`
  - Will be:
    - `idle` initial status prior to the mutation function executing.
    - `loading` if the mutation is currently executing.
    - `error` if the last mutation attempt resulted in an error.
    - `success` if the last mutation attempt was successful.
- `isIdle`, `isLoading`, `isSuccess`, `isError`: boolean variables derived from `status`
- `data: undefined | unknown`
  - Defaults to `undefined`
  - The last successfully resolved data for the query.
- `error: null | TError`
  - The error object for the query, if an error was encountered.
- `reset: () => void`
  - A function to clean the mutation internal state (i.e., it resets the mutation to its initial state).
