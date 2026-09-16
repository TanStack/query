---
id: useIsMutating
title: useIsMutating
---

```ts
function useIsMutating(filters, queryClient?): Ref<number>;
```

Defined in: [packages/vue-query/src/useMutationState.ts:53](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useMutationState.ts#L53)

The `useIsMutating` composable returns a `ref` to the `number` of mutations that your application currently
has `pending` (useful for app-wide loading indicators).

`filters` may be a plain object, `MaybeRefDeep`, or a reactive getter (`() => ({ ... })`) — pass a getter if
the filters themselves depend on other reactive state.

## Parameters

### filters

[`UseIsMutatingFilters`](../type-aliases/UseIsMutatingFilters.md) = `{}`

The [MutationFilters](../interfaces/MutationFilters.md) to narrow down the matched mutations.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

## Returns

`Ref`\<`number`\>

A `ref` to the `number` of the mutations that your application currently has `pending`.

## Example

```vue
<script setup lang="ts">
import { useIsMutating } from '@tanstack/vue-query'

// How many mutations matching the posts prefix are in progress?
const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
</script>

<template>
  <span v-if="isMutatingPosts">Saving posts...</span>
</template>
```
