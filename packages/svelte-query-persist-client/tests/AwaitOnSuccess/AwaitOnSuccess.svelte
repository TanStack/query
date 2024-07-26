<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte.js'

  let { states }: { states: Array<string> } = $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      states.push('fetching')
      await sleep(5)
      states.push('fetched')
      return 'fetched'
    },
  }))
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
