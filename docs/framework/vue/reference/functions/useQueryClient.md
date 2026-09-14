---
id: useQueryClient
title: useQueryClient
---

```ts
function useQueryClient(id): QueryClient;
```

Defined in: [packages/vue-query/src/useQueryClient.ts:27](https://github.com/TanStack/query/blob/main/packages/vue-query/src/useQueryClient.ts#L27)

Retrieves the `QueryClient` installed by `VueQueryPlugin`, via Vue's `inject`. Must be called inside
`setup()` or another function that supports an injection context.

## Parameters

### id

`string` = `''`

The `queryClientKey` passed to `VueQueryPlugin` — only needed when multiple `QueryClient`s are
installed in the same app.

## Returns

[`QueryClient`](../classes/QueryClient.md)

## Throws

If called outside an injection context, or if no `QueryClient` was installed via `VueQueryPlugin`.

## Example

```vue
<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

function invalidate() {
  queryClient.invalidateQueries({ queryKey: ['todos'] })
}
</script>
```
