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

  const s = createQueries({
    queries: [
      {
        queryKey: key,
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

<div>
  <h1>{s[0].data}</h1>
  <h2>fetchStatus: {s[0].fetchStatus}</h2>
</div>
