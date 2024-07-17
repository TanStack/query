<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte'
  import type { StatusResult } from '../utils.svelte'

  let { states }: { states: { value: Array<StatusResult<string>> } } = $props()

  const query = createQuery({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },
  })

  $effect(() => {
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>{query.data}</div>
<div>fetchStatus: {query.fetchStatus}</div>
