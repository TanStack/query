<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte'
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from './context'

  let { client, children } = $props<{
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