<script lang="ts">
  import '../app.css'
  import { browser } from '$app/environment'
  import { QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client'
  import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

  const { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  const persister = createSyncStoragePersister({
    storage: browser ? window.localStorage : null,
  })
</script>

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
  <main>
    {@render children()}
  </main>
  <SvelteQueryDevtools />
</PersistQueryClientProvider>
