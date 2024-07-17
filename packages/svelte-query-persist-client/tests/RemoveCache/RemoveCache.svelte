<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte'

  const query = createQuery({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },
  })
</script>

<div>{$query.data}</div>
<div>fetchStatus: {$query.fetchStatus}</div>
