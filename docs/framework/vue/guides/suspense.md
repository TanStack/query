---
id: suspense
title: Suspense (experimental)
---

> NOTE: Suspense mode for Vue Query is experimental, same as Vue's Suspense itself. These APIs WILL change and should not be used in production unless you lock both your Vue and Vue Query versions to patch-level versions that are compatible with each other.

Vue Query can also be used with Vue's new [Suspense](https://vuejs.org/guide/built-ins/suspense.html) API's.

To do that you need to wrap your suspendable component with `Suspense` component provided by Vue

```vue
<script setup>
import SuspendableComponent from './SuspendableComponent.vue'
</script>

<template>
  <Suspense>
    <template #default>
      <SuspendableComponent />
    </template>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

And change your `setup` function in suspendable component to be `async`. Then you can use async `suspense` function that is provided by `vue-query` (both `useQuery` and `useInfiniteQuery` return it).

```vue
<script>
import { defineComponent } from 'vue'
import { useQuery } from '@tanstack/vue-query'

const todoFetcher = async () =>
  await fetch('https://jsonplaceholder.cypress.io/todos').then((response) =>
    response.json(),
  )
export default defineComponent({
  name: 'SuspendableComponent',
  async setup() {
    const { data, suspense } = useQuery({
      queryKey: ['todos'],
      queryFn: todoFetcher,
    })
    await suspense()

    return { data }
  },
})
</script>
```

## How `suspense()` resolves

- If the query has no data or its data is stale, it fetches the query and resolves with the result once that fetch resolves. This is usually when the query function finishes, but can be earlier, such as after the first chunk of an `experimental_streamedQuery` or when `setQueryData` sets data while the fetch is in flight.
- If the data is fresh, it resolves immediately without refetching.
- While the query is disabled (`enabled: false`), it waits until the query is enabled, so it never resolves for a query that stays disabled. On the server, this blocks the render, see [SSR](./ssr.md#suspense-of-a-disabled-query-never-resolves-on-the-server).
- If the fetch fails, it resolves with the query result in the error state. It rejects with the error only when `throwOnError` is (or returns) `true`.

## Error handling

Since `suspense()` resolves with the error result by default, the component still renders after a failed fetch and can read `error` from the query. To let a parent component handle the error instead, set `throwOnError: true`. `await suspense()` then rejects, the error propagates out of the `async` `setup`, and you can catch it with [`onErrorCaptured`](https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured) in a parent of `Suspense`:

```vue
<script setup>
import { onErrorCaptured, ref } from 'vue'
import SuspendableComponent from './SuspendableComponent.vue'

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>

<template>
  <div v-if="error">Something went wrong: {{ error.message }}</div>
  <Suspense v-else>
    <template #default>
      <SuspendableComponent />
    </template>
    <template #fallback>
      <div>Loading...</div>
    </template>
  </Suspense>
</template>
```

## Fetch-on-render vs Render-as-you-fetch

Out of the box, Vue Query in `suspense` mode works really well as a **Fetch-on-render** solution with no additional configuration. This means that when your components attempt to mount, they will trigger query fetching and suspend, but only once you have imported them and mounted them. If you want to take it to the next level and implement a **Render-as-you-fetch** model, we recommend implementing [Prefetching](./prefetching) on routing callbacks and/or user interactions events to start loading queries before they are mounted and hopefully even before you start importing or mounting their parent components.
