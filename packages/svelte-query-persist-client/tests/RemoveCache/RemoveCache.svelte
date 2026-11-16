<script lang="ts">
  import { sleep } from '@tanstack/query-test-utils'
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: () => sleep(10).then(() => 'fetched'),
  }))
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
