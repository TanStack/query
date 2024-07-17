<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'

  let { key, states = $bindable() }: { key: string[]; states: string[] } =
    $props()

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      states.push('fetching')
      await sleep(10)
      states.push('fetched')
      return 'fetched'
    },
  })
</script>

<div>
  <h1>{state.data}</h1>
  <h2>fetchStatus: {state.fetchStatus}</h2>
</div>
