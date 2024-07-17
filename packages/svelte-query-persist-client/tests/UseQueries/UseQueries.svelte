<script lang="ts">
  import { untrack } from 'svelte'
  import { createQueries } from '@tanstack/svelte-query'
  import { sleep } from '../utils.svelte'
  import type { StatusResult } from '../utils.svelte'

  let {
    key,
    states,
  }: {
    key: Array<string>
    states: { value: Array<StatusResult<string>> }
  } = $props()

  const queries = createQueries({
    queries: [
      {
        queryKey: ['test'],
        queryFn: async (): Promise<string> => {
          await sleep(10)
          return 'fetched'
        },
      },
    ],
  })

  $effect(() => {
    states.value = [...untrack(() => states.value), $state.snapshot(s[0])]
  })
</script>

<div>{$queries[0].data}</div>
<div>fetchStatus: {$queries[0].fetchStatus}</div>
