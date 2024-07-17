<script lang="ts">
  import { untrack } from 'svelte'
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte'
  import type { StatusResult } from '../utils.svelte'

  let {
    key,
    states,
  }: {
    key: Array<string>
    states: { value: Array<StatusResult<string>> }
    fetched: boolean
  } = $props()

  const query = createQuery({
    queryKey: ['test'],
    queryFn: async () => {
      states.value.push('fetched')
      await sleep(10)
      return 'fetched'
    },

    staleTime: Infinity,
  })

  $effect(() => {
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>data: {$query.data ?? 'null'}</div>
<div>fetchStatus: {$query.fetchStatus}</div>
