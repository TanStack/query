---
id: mutationOptions
title: mutationOptions
---

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): WithRequired<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [preact-query/src/mutationOptions.ts:44](https://github.com/TanStack/query/blob/main/packages/preact-query/src/mutationOptions.ts#L44)

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

`WithRequired`\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

### Returns

`WithRequired`\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

### Examples

```tsx
import { mutationOptions, useMutation } from '@tanstack/preact-query'

export const createPostOptions = mutationOptions({
  mutationKey: ['posts', 'create'],
  mutationFn: createPost,
})

function CreatePost() {
  const mutation = useMutation(createPostOptions)
  return <button onClick={() => mutation.mutate({ title: 'Hello' })}>Create</button>
}
```

Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
```tsx
import { mutationOptions, useMutationState } from '@tanstack/preact-query'

const createPostOptions = mutationOptions({
  mutationKey: ['posts', 'create'],
  mutationFn: createPost,
})

function SavingIndicator() {
  const isCreatingPost = useMutationState({
    filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
  }).length > 0

  return isCreatingPost ? <span>Saving…</span> : null
}
```

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): Omit<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [preact-query/src/mutationOptions.ts:77](https://github.com/TanStack/query/blob/main/packages/preact-query/src/mutationOptions.ts#L77)

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

`Omit`\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

### Returns

`Omit`\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

### Example

```tsx
import { mutationOptions, useMutation } from '@tanstack/preact-query'

export const createPostOptions = mutationOptions({
  mutationFn: createPost,
})

function CreatePost() {
  const mutation = useMutation(createPostOptions)
  return <button onClick={() => mutation.mutate({ title: 'Hello' })}>Create</button>
}
```
