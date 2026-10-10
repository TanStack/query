---
id: mutationOptions
title: mutationOptions
---

## Overview

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options: WithRequired<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">): WithRequired<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options: Omit<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">): Omit<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

- [`WithRequired<UseMutationOptions>` → `WithRequired<UseMutationOptions>`](#call-signature-1): You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. A `mutationKey` is required on this overload so the mutation can be looked up later, e.g. with `useMutationState`.
- [`Omit<UseMutationOptions>` → `Omit<UseMutationOptions>`](#call-signature-2): You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. No `mutationKey` is required on this overload — use this when you don't need to target the mutation via a `mutationKey` filter later (e.g. with `useMutationState`); it can still be observed through other filters, such as `status`.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options: WithRequired<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">): WithRequired<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [packages/preact-query/src/mutationOptions.ts:32](https://github.com/TanStack/query/blob/main/packages/preact-query/src/mutationOptions.ts#L32)

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

[`WithRequired`](../type-aliases/WithRequired.md)\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The mutation options to use, identical to what you'd pass to `useMutation`, with a
required `mutationKey`.

### Returns

[`WithRequired`](../type-aliases/WithRequired.md)\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

### See

[useMutation](useMutation.md) to run the mutation these options describe.

### Example

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

<a id="call-signature-2"></a>

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options: Omit<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">): Omit<UseMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [packages/preact-query/src/mutationOptions.ts:70](https://github.com/TanStack/query/blob/main/packages/preact-query/src/mutationOptions.ts#L70)

You can generally pass everything to `mutationOptions` that you can also pass to `useMutation`. No
`mutationKey` is required on this overload — use this when you don't need to target the mutation via a
`mutationKey` filter later (e.g. with `useMutationState`); it can still be observed through other filters,
such as `status`.

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

The mutation options to use, identical to what you'd pass to `useMutation`, without a
`mutationKey`.

### Returns

`Omit`\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

### Remarks

See the other overload's example for looking a mutation up via `useMutationState`.

### See

[useMutation](useMutation.md) to run the mutation these options describe.

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

<a id="parameters-summary"></a>

## Parameters

### options

`Omit`\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The mutation options to use, identical to what you'd pass to `useMutation`, without a
`mutationKey`.

<a id="options-properties"></a>

#### `options` properties

Built from [`UseMutationOptions`](../interfaces/UseMutationOptions.md#properties). See the type above for what it changes.

<a id="returns-summary"></a>

## Returns

`Omit`\<[`UseMutationOptions`](../interfaces/UseMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

<a id="result-properties"></a>

### Result properties

Built from [`UseMutationOptions`](../interfaces/UseMutationOptions.md#properties). See the type above for what it changes.
