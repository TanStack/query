<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'

  export let key: Array<string>
  export let states: Array<string>

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      states = [...states, 'fetching']
      await sleep(10)
      states = [...states, 'fetched']
      return 'fetched'
    },
  })
</script>

<div>
  <h1>{state.data}</h1>
  <h2>fetchStatus: {state.fetchStatus}</h2>
</div>
