<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '@tanstack/query-test-utils'
  import { StatelessRef } from '../utils.svelte.js'

  let { states }: { states: StatelessRef<Array<string>> } = $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      states.current.push('fetching')
      await sleep(5)
      states.current.push('fetched')
      return 'fetched'
    },
  }))
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
