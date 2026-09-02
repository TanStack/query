---
id: mutationOptions
title: mutationOptions
---

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): WithRequired<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [mutationOptions.ts:33](https://github.com/TanStack/query/blob/main/packages/solid-query/src/mutationOptions.ts#L33)

You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. A
`mutationKey` is required on this overload so the mutation can be looked up later, e.g. with
`useMutationState`.

### Type Parameters

#### TData

`TData` = `unknown`

#### TError

`TError` = `Error`

#### TVariables

`TVariables` = `void`

#### TOnMutateResult

`TOnMutateResult` = `unknown`

### Parameters

#### options

`WithRequired`\<[`MutationOptions`](../interfaces/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The mutation options to use, identical to what you'd pass to `useMutation`, with a
required `mutationKey`.

### Returns

`WithRequired`\<[`MutationOptions`](../interfaces/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

### See

[useMutation](useMutation.md) to run the mutation these options describe.

### Example

Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
```tsx
import { mutationOptions, useMutationState } from '@tanstack/solid-query'

const createPostOptions = mutationOptions({
  mutationKey: ['posts', 'create'],
  mutationFn: createPost,
})

function SavingIndicator() {
  const isCreatingPost = useMutationState(() => ({
    filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
  }))

  return isCreatingPost().length > 0 ? <span>Saving…</span> : null
}
```

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): Omit<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [mutationOptions.ts:74](https://github.com/TanStack/query/blob/main/packages/solid-query/src/mutationOptions.ts#L74)

You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. No
`mutationKey` is required on this overload — use this when you don't need to look the mutation up later
(e.g. with `useMutationState`).

### Type Parameters

#### TData

`TData` = `unknown`

#### TError

`TError` = `Error`

#### TVariables

`TVariables` = `void`

#### TOnMutateResult

`TOnMutateResult` = `unknown`

### Parameters

#### options

`Omit`\<[`MutationOptions`](../interfaces/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The mutation options to use, identical to what you'd pass to `useMutation`, without a
`mutationKey`.

### Returns

`Omit`\<[`MutationOptions`](../interfaces/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

### See

[useMutation](useMutation.md) to run the mutation these options describe.

### Remarks

Without a `mutationKey`, the mutation can't be targeted via a `mutationKey` filter in
`useMutationState` — it can still be observed through other filters, such as `status` — see the other
overload's example for that.

### Example

```tsx
import { mutationOptions, useMutation } from '@tanstack/solid-query'

const createPostOptions = mutationOptions({
  mutationFn: createPost,
})

function CreatePost() {
  const createPostMutation = useMutation(() => createPostOptions)
  return <button onClick={() => createPostMutation.mutate({ title: 'Hello' })}>Create</button>
}
```
