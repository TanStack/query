<script lang="ts">
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client'
  import { Toaster } from 'svelte-sonner'
  import { persister, queryClient } from '$lib/queryClient'

  let { children } = $props()
</script>

<svelte:head>
  <title>TanStack Query Svelte Offline Example</title>
</svelte:head>

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister }}
  onSuccess={() => {
    // resume mutations after initial restore from localStorage was successful
    queryClient.resumePausedMutations().then(() => {
      queryClient.invalidateQueries()
    })
  }}
>
  <div style="padding: 16px">
    {@render children()}
  </div>
  <Toaster />
  <SvelteQueryDevtools initialIsOpen />
</PersistQueryClientProvider>
