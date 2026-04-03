<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '@tanstack/query-test-utils'

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: () => sleep(10).then(() => 'fetched'),
  }))
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
