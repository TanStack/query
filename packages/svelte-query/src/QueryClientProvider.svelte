<script lang="ts">
  import { type Snippet, onDestroy, onMount } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from './context'

  const { client = new QueryClient(), children } = $props<{
    client: QueryClient
    children: Snippet
  }>()
  onMount(() => {
    client.mount()
  })

  setQueryClientContext(client)

  onDestroy(() => {
    client.unmount()
  })
</script>

{@render children()}
