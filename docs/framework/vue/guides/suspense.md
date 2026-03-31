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

And change your `setup` function in suspendable component to be `async`. Then you can use async `suspense` function that is provided by `vue-query`.

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
    const { data, suspense } = useQuery(['todos'], todoFetcher)
    await suspense()

    return { data }
  },
})
</script>
```

## Fetch-on-render vs Render-as-you-fetch

Out of the box, Vue Query in `suspense` mode works really well as a **Fetch-on-render** solution with no additional configuration. This means that when your components attempt to mount, they will trigger query fetching and suspend, but only once you have imported them and mounted them. If you want to take it to the next level and implement a **Render-as-you-fetch** model, we recommend implementing [Prefetching](./prefetching) on routing callbacks and/or user interactions events to start loading queries before they are mounted and hopefully even before you start importing or mounting their parent components.
