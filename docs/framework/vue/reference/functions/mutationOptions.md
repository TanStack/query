---
id: mutationOptions
title: mutationOptions
---

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): WithRequired<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [packages/vue-query/src/mutationOptions.ts:34](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationOptions.ts#L34)

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

[`WithRequired`](../type-aliases/WithRequired.md)\<[`MutationOptions`](../type-aliases/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The mutation options to use, identical to what you'd pass to `useMutation`, with a
required `mutationKey`.

### Returns

[`WithRequired`](../type-aliases/WithRequired.md)\<[`MutationOptions`](../type-aliases/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

### See

[useMutation](useMutation.md) to run the mutation these options describe.

### Example

Looking the mutation up elsewhere via its `mutationKey`, e.g. for a global "saving…" indicator:
```vue
<script setup lang="ts">
import { mutationOptions, useMutationState } from '@tanstack/vue-query'
import { computed } from 'vue'

const createPostOptions = mutationOptions({
  mutationKey: ['posts', 'create'],
  mutationFn: createPost,
})

// Call `useMutationState` once — it manages its own subscription — then derive from its result.
const creatingPosts = useMutationState({
  filters: { mutationKey: createPostOptions.mutationKey, status: 'pending' },
})
const isCreatingPost = computed(() => creatingPosts.value.length > 0)
</script>
```

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): () => WithRequired<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [packages/vue-query/src/mutationOptions.ts:80](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationOptions.ts#L80)

Same as the plain-object overload with a required `mutationKey`, but for options that close over reactive
state (`ref`s read inside the function body). Wrap them in a getter so `useMutation` and the other consumers
always read the current values instead of the ones captured when the options were created.

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

() => [`WithRequired`](../type-aliases/WithRequired.md)\<[`MutationOptions`](../type-aliases/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

A function returning the mutation options to use, with a required `mutationKey`,
re-evaluated on demand.

### Returns

A function that returns the same options object, unchanged.

```ts
(): WithRequired<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

#### Returns

[`WithRequired`](../type-aliases/WithRequired.md)\<[`MutationOptions`](../type-aliases/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

### See

[useMutation](useMutation.md) to run the mutation these options describe.

### Example

```vue
<script setup lang="ts">
import { mutationOptions, useMutation } from '@tanstack/vue-query'

const props = defineProps<{ userId: number }>()

const createPostOptions = mutationOptions(() => ({
  mutationKey: ['posts', 'create'],
  // Reacts to changes on `props.userId`, unlike the plain-object overload.
  mutationFn: (title: string) => createPost({ title, userId: props.userId }),
}))

const mutation = useMutation(createPostOptions)
</script>

<template>
  <button @click="mutation.mutate('Hello')">Create</button>
</template>
```

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): Omit<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [packages/vue-query/src/mutationOptions.ts:124](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationOptions.ts#L124)

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

`Omit`\<[`MutationOptions`](../type-aliases/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The mutation options to use, identical to what you'd pass to `useMutation`, without a
`mutationKey`.

### Returns

`Omit`\<[`MutationOptions`](../type-aliases/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

The same options object, unchanged.

### See

[useMutation](useMutation.md) to run the mutation these options describe.

### Remarks

See the other overload's example for looking a mutation up via `useMutationState`.

### Example

```vue
<script setup lang="ts">
import { mutationOptions, useMutation } from '@tanstack/vue-query'

const createPostOptions = mutationOptions({
  mutationFn: createPost,
})

const mutation = useMutation(createPostOptions)
</script>

<template>
  <button @click="mutation.mutate({ title: 'Hello' })">Create</button>
</template>
```

## Call Signature

```ts
function mutationOptions<TData, TError, TVariables, TOnMutateResult>(options): () => Omit<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

Defined in: [packages/vue-query/src/mutationOptions.ts:169](https://github.com/TanStack/query/blob/main/packages/vue-query/src/mutationOptions.ts#L169)

Same as the plain-object overload without a `mutationKey`, but for options that close over reactive state
(`ref`s read inside the function body). Wrap them in a getter so `useMutation` and the other consumers
always read the current values instead of the ones captured when the options were created.

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

() => `Omit`\<[`MutationOptions`](../type-aliases/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

A function returning the mutation options to use, without a `mutationKey`, re-evaluated on
demand.

### Returns

A function that returns the same options object, unchanged.

```ts
(): Omit<MutationOptions<TData, TError, TVariables, TOnMutateResult>, "mutationKey">;
```

#### Returns

`Omit`\<[`MutationOptions`](../type-aliases/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>, `"mutationKey"`\>

### See

[useMutation](useMutation.md) to run the mutation these options describe.

### Example

```vue
<script setup lang="ts">
import { mutationOptions, useMutation } from '@tanstack/vue-query'

const props = defineProps<{ userId: number }>()

const createPostOptions = mutationOptions(() => ({
  // Reacts to changes on `props.userId`, unlike the plain-object overload.
  mutationFn: (title: string) => createPost({ title, userId: props.userId }),
}))

const mutation = useMutation(createPostOptions)
</script>

<template>
  <button @click="mutation.mutate('Hello')">Create</button>
</template>
```
