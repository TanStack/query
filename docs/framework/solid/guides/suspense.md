---
id: suspense
title: Suspense
---

Solid Query can also be used with Solid's [Suspense](https://docs.solidjs.com/reference/components/suspense) API's.

To do that you need to wrap your suspendable component with `Suspense` component provided by Vue

```tsx
import { Suspense } from 'solid-js'

;<Suspense fallback={<LoadingSpinner />}>
  <SuspendableComponent />
</Suspense>
```

You can use async `suspense` function that is provided by `solid-query`.

```vue
<script>
import { defineComponent } from 'vue'
import { useQuery } from '@tanstack/solid-query'

const todoFetcher = async () =>
  await fetch('https://jsonplaceholder.cypress.io/todos').then((response) =>
    response.json(),
  )
export default defineComponent({
  name: 'SuspendableComponent',
  async setup() {
    const { data, suspense } = useQuery(() => ['todos'], todoFetcher)
    await suspense()

    return { data }
  },
})
</script>
```

## Fetch-on-render vs Render-as-you-fetch

Out of the box, Solid Query in `suspense` mode works really well as a **Fetch-on-render** solution with no additional configuration. This means that when your components attempt to mount, they will trigger query fetching and suspend, but only once you have imported them and mounted them. If you want to take it to the next level and implement a **Render-as-you-fetch** model, we recommend implementing [Prefetching](../prefetching) on routing callbacks and/or user interactions events to start loading queries before they are mounted and hopefully even before you start importing or mounting their parent components.
