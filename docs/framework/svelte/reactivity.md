---
id: reactivity
title: Reactivity
---

Svelte uses a compiler to build your code which optimizes rendering. By default, components run once, unless they are referenced in your markup. To be able to react to changes in options you need to use [stores](https://svelte.dev/docs/svelte-store).

In the below example, the `refetchInterval` option is set from the variable `intervalMs`, which is bound to the input field. However, as the query is not able to react to changes in `intervalMs`, `refetchInterval` will not change when the input value changes.

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let intervalMs = 1000

  const query = createQuery({
    queryKey: ['refetch'],
    queryFn: async () => await fetch('/api/data').then((r) => r.json()),
    refetchInterval: intervalMs,
  })
</script>

<input type="number" bind:value={intervalMs} />
```

To solve this, we can convert `intervalMs` into a writable store. The query options can then be turned into a derived store, which will be passed into the function with true reactivity.

```svelte
<script lang="ts">
  import { derived, writable } from 'svelte/store'
  import { createQuery } from '@tanstack/svelte-query'

  const intervalMs = writable(1000)

  const query = createQuery(
    derived(intervalMs, ($intervalMs) => ({
      queryKey: ['refetch'],
      queryFn: async () => await fetch('/api/data').then((r) => r.json()),
      refetchInterval: $intervalMs,
    })),
  )
</script>

<input type="number" bind:value={$intervalMs} />
```
