<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: () => Promise.resolve('fetched'),
  }))
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
