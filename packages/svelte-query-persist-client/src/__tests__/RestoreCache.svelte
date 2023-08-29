<script lang='ts'>
  import { createQuery } from '@tanstack/svelte-query'
  import { get, writable } from 'svelte/store'
  import { sleep } from './utils'
  import type { QueryObserverResult } from '@tanstack/svelte-query'
  import type { Writable } from 'svelte/store'

  export const key: string[] = []
  export const states: Writable<QueryObserverResult<string>[]> = writable([])

  const state = createQuery({
    queryKey: key,
    queryFn: async () => {
      await sleep(10)
      return 'fetched'
    },
  })
  let data = get(state).data
  let fetchStatus = get(state).fetchStatus
  state.subscribe((s) => {
    states.update((prev) => [...prev, s])
    data = s.data
    fetchStatus = s.fetchStatus
  })
  
</script>
<div>
  <h1>{data}</h1>
  <h2>fetchStatus: {fetchStatus}</h2>
</div>