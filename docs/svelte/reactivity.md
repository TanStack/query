---
id: reactivity
title: Reactivity
---

Svelte uses a compiler to build your code which optimises rendering. By default, variables will run once, unless they are referenced in your markup. To make a different variable or function reactive, you need to use [reactive declarations](https://svelte.dev/tutorial/reactive-declarations). This also applies to Svelte Query.

In the below example, the `refetchInterval` option is set from the variable `intervalMs`, which is edited by the input field. However, as the query is not told it should react to changes in `intervalMs`, `refetchInterval` will not change when the input value changes.

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let intervalMs = 1000

  const endpoint = 'http://localhost:5173/api/data'

  const query = createQuery({
    queryKey: ['refetch'],
    queryFn: async () => await fetch(endpoint).then((r) => r.json()),
    refetchInterval: intervalMs,
  })
</script>

<input bind:value={intervalMs} type="number" />
```

To solve this, you can prefix the query with `$: ` to tell the compiler it should be reactive.

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let intervalMs = 1000

  const endpoint = 'http://localhost:5173/api/data'

  $: query = createQuery({
    queryKey: ['refetch'],
    queryFn: async () => await fetch(endpoint).then((r) => r.json()),
    refetchInterval: intervalMs,
  })
</script>

<input bind:value={intervalMs} type="number" />
```
