---
id: mutationOptions
title: mutationOptions
---

## Overview

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options: WithRequired<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">): WithRequired<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options: Omit<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">): Omit<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

- [`WithRequired` → `WithRequired`](#call-signature-1): You can generally pass everything to `mutationOptions` that you can also pass to `createMutation`. This overload requires `mutationKey`, so the resulting options can be looked up elsewhere (e.g. with `useMutationState`).
- [`Omit` → `Omit`](#call-signature-2): You can generally pass everything to `mutationOptions` that you can also pass to `createMutation`.

See also: [Parameters](#parameters-summary) · [Returns](#returns-summary)

<a id="call-signature-1"></a>

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options: WithRequired<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">): WithRequired<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [packages/svelte-query/src/mutationOptions.ts:32](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/mutationOptions.ts#L32)

You can generally pass everything to `mutationOptions` that you can also pass to `createMutation`. This
overload requires `mutationKey`, so the resulting options can be looked up elsewhere (e.g. with
`useMutationState`).

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

[`WithRequired`](../type-aliases/WithRequired.md)\<[`CreateMutationOptions`](../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The options to use — everything you can pass to `createMutation`, with `mutationKey` set.

### Returns

[`WithRequired`](../type-aliases/WithRequired.md)\<[`CreateMutationOptions`](../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object.

### See

[createMutation](createMutation.md) to run a mutation with these options.

### Example

Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
```svelte
<script lang="ts">
  import { mutationOptions, useMutationState } from '@tanstack/svelte-query'

  const createPostOptions = mutationOptions({
    mutationKey: ['posts', 'create'],
    mutationFn: createPost,
  })

  const pending = useMutationState({
    filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
  })
</script>

{#if pending.length > 0}
  <span>Saving…</span>
{/if}
```

<a id="call-signature-2"></a>

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options: Omit<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">): Omit<CreateMutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [packages/svelte-query/src/mutationOptions.ts:67](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/mutationOptions.ts#L67)

You can generally pass everything to `mutationOptions` that you can also pass to `createMutation`.

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

`Omit`\<[`CreateMutationOptions`](../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The options to use — everything you can pass to `createMutation`.

### Returns

`Omit`\<[`CreateMutationOptions`](../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object.

### See

[createMutation](createMutation.md) to run a mutation with these options.

### Example

```svelte
<script lang="ts">
  import { mutationOptions, createMutation } from '@tanstack/svelte-query'

  const createPostOptions = mutationOptions({
    mutationFn: createPost,
  })

  const mutation = createMutation(() => createPostOptions)
</script>

<button onclick={() => mutation.mutate({ title: 'Hello' })}>Create</button>
```

<a id="parameters-summary"></a>

## Parameters

### options

`Omit`\<[`CreateMutationOptions`](../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The options to use — everything you can pass to `createMutation`.

<a id="options-properties"></a>

#### `options` properties

Built from [`MutationObserverOptions`](../interfaces/MutationObserverOptions.md#properties). See the type above for what it changes.

<a id="returns-summary"></a>

## Returns

`Omit`\<[`CreateMutationOptions`](../type-aliases/CreateMutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object.

<a id="result-properties"></a>

### Result properties

Built from [`MutationObserverOptions`](../interfaces/MutationObserverOptions.md#properties). See the type above for what it changes.
