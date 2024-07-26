<script lang="ts">
  import { untrack } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { createQuery } from '../../src/index.js'
  import { sleep } from '../utils.svelte.js'
  import type { QueryObserverResult } from '@tanstack/query-core'

  let {
    states,
  }: {
    states: { value: Array<QueryObserverResult> }
  } = $props()

  const queryClient = new QueryClient()
  let count = $state(0)

  const query = createQuery(
    () => ({
      queryKey: ['test'],
      queryFn: async () => {
        await sleep(5)
        return ++count
      },
    }),
    queryClient,
  )

  $effect(() => {
    // @ts-expect-error
    // svelte-ignore state_snapshot_uncloneable
    states.value = [...untrack(() => states.value), $state.snapshot(query)]
  })
</script>

<button onclick={() => queryClient.removeQueries({ queryKey: ['test'] })}
  >Remove</button
>
<button onclick={() => query.refetch()}>Refetch</button>

<div>Data: {query.data ?? 'undefined'}</div>
