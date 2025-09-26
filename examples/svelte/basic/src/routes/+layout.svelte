<script lang="ts">
  import '../app.css'
  import { browser } from '$app/environment'
  import { QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client'
  import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  const persister = createAsyncStoragePersister({
    storage: browser ? window.localStorage : null,
  })
</script>

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
  <main>
    <slot />
  </main>
  <SvelteQueryDevtools />
</PersistQueryClientProvider>
