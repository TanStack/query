<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '../utils'

  interface Props {
    key: Array<string>
  }

  let { key }: Props = $props()

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },
  })
</script>

<div>
  <h1>{state.data}</h1>
  <h2>fetchStatus: {state.fetchStatus}</h2>
</div>
