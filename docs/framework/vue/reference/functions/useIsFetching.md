---
id: useIsFetching
title: useIsFetching
---

```ts
function useIsFetching(fetchingFilters, queryClient?): Ref<number>;
```

Defined in: [packages/vue-query/src/useIsFetching.ts:52](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useIsFetching.ts#L52)

The `useIsFetching` composable returns a `ref` to the `number` of the queries that your application is
loading or fetching in the background (useful for app-wide loading indicators).

`fetchingFilters` may be a plain object, `MaybeRefDeep`, or a reactive getter (`() => ({ ... })`) — pass a
getter if the filters themselves depend on other reactive state.

## Parameters

### fetchingFilters

[`QueryFilters`](../type-aliases/QueryFilters.md) = `{}`

The [QueryFilters](../type-aliases/QueryFilters.md) to narrow down the matched queries.

### queryClient?

[`QueryClient`](../classes/QueryClient.md)

Use this to use a custom `QueryClient`. Otherwise, the one provided by `VueQueryPlugin`
will be used.

## Returns

`Ref`\<`number`\>

A `ref` to the `number` of the queries that your application is currently loading or fetching in
the background.

## Examples

```vue
<script setup lang="ts">
import { useIsFetching } from '@tanstack/vue-query'

// How many queries matching the posts prefix are fetching?
const isFetchingPosts = useIsFetching({ queryKey: ['posts'] })
</script>

<template>
  <span v-if="isFetchingPosts">Refreshing posts...</span>
</template>
```

A global loading indicator for any query fetching in the background, not just the ones on screen:
```vue
<script setup lang="ts">
import { useIsFetching } from '@tanstack/vue-query'

const isFetching = useIsFetching()
</script>

<template>
  <div v-if="isFetching">Queries are fetching in the background...</div>
</template>
```
