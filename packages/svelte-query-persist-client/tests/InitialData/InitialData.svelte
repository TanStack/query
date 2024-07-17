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
  } = $props()

  const query = createQuery({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },

    initialData: 'initial',
    // make sure that initial data is older than the hydration data
    // otherwise initialData would be newer and takes precedence
    initialDataUpdatedAt: 1,
  })

  $effect(() => {
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<div>{$query.data}</div>
<div>fetchStatus: {$query.fetchStatus}</div>
