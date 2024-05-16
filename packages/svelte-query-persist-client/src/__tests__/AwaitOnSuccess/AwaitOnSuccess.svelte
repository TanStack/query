<script lang="ts">
import { createQuery } from '@tanstack/svelte-query'
import { get } from 'svelte/store'
import { sleep } from '../utils'
import type { Writable } from 'svelte/store'

export let key: Array<string>
export let states: Writable<Array<string>>

const state = createQuery({
  queryKey: key,
  queryFn: async () => {
    states.update((s) => [...s, 'fetching'])
    await sleep(10)
    states.update((s) => [...s, 'fetched'])
    return 'fetched'
  },
})

let data = get(state).data
let fetchStatus = get(state).fetchStatus
state.subscribe((s) => {
  data = s.data
  fetchStatus = s.fetchStatus
})
</script>

<div>
  <h1>{data}</h1>
  <h2>fetchStatus: {fetchStatus}</h2>
</div>
