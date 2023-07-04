---
id: reactivity
title: Reactivity
---

Svelte uses a compiler to build your code which optimises rendering. By default, variables will run once, unless they are referenced in your markup. To be able to react to changes in options you need to use [stores](https://svelte.dev/docs/svelte-store).

In the below example, the `refetchInterval` option is set from the variable `intervalMs`, which is edited by the input field. However, as the query is not told it should react to changes in `intervalMs`, `refetchInterval` will not change when the input value changes.

```markdown
<script>
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

To solve this, create a store for the options and use it as input for the query. Update the options store when the value changes and the query will react to the change.

```markdown
<script>
  import { createQuery } from '@tanstack/svelte-query'
  import type { CreateQueryOptions } from '@tanstack/svelte-query'

  const endpoint = 'http://localhost:5173/api/data'

  const queryOptions = writable({
    queryKey: ['refetch'],
    queryFn: async () => await fetch(endpoint).then((r) => r.json()),
    refetchInterval: 1000,
  }) satisfies CreateQueryOptions

const query = createQuery(queryOptions)
</script>

<input type="number" bind:value={$queryOptions.refetchInterval} />
```
