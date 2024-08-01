<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from './context.js'

  export let client = new QueryClient()

  onMount(() => {
    client.mount()
  })

  setQueryClientContext(client)

  onDestroy(() => {
    client.unmount()
  })
</script>

<slot />
