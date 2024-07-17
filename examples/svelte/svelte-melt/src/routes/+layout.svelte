<script lang="ts">
  import { QueryClient, useIsRestoring } from '@tanstack/svelte-query/dev'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import {
    persistQueryClient,
    PersistQueryClientProvider,
  } from '@tanstack/svelte-query-persist-client'
  import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
  import { browser } from '$app/environment'

  const { children } = $props()

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        staleTime: 100000,
      },
    },
  })
  const localStoragePersister = createSyncStoragePersister({
    storage: browser ? window.localStorage : null,
  })
  browser
    ? persistQueryClient({ queryClient, persister: localStoragePersister })
    : ''

  const isRes = useIsRestoring()
</script>

<PersistQueryClientProvider
  client={queryClient}
  persistOptions={{ persister: localStoragePersister }}
>
  <SvelteQueryDevtools />
  <main>
    {@render children()}
  </main>
</PersistQueryClientProvider>
