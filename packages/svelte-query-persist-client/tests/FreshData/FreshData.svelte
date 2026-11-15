<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { sleep } from '@tanstack/query-test-utils'
  import type { StatelessRef, StatusResult } from '../utils.svelte.js'

  type Props = {
    states: StatelessRef<Array<StatusResult<string>>>
    onFetch: () => void
  }

  let { states, onFetch }: Props = $props()

  const query = createQuery(() => ({
    queryKey: ['test'],
    queryFn: async () => {
      await sleep(10)
      onFetch()
      return 'fetched'
    },
    staleTime: Infinity,
  }))

  $effect(() => {
    const snapshot = $state.snapshot(query)
    states.current.push(snapshot)
  })
</script>

<div>data: {query.data ?? 'null'}</div>
<div>fetchStatus: {query.fetchStatus}</div>
