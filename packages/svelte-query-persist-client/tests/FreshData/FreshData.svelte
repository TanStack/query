<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'
  import type { Writable } from 'svelte/store'
  import type { StatusResult } from '../utils'

  export let key: Array<string>
  export let states: Writable<Array<StatusResult<string>>>
  export let fetched: Writable<boolean>

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      fetched.set(true)
      await sleep(10)
      return 'fetched'
    },

    staleTime: Infinity,
  })

  state.subscribe((s) => {
    states.update((prev) => [
      ...prev,
      { status: s.status, data: s.data, fetchStatus: s.fetchStatus },
    ])
  })
</script>

<div>
  <h1>data: {$state.data ?? 'null'}</h1>
  <h2>fetchStatus: {$state.fetchStatus}</h2>
</div>
