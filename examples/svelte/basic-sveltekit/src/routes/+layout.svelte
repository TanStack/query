<script lang="ts">
  import '../app.css'
  import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
  import { QueryClient } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import { PersistQueryClientProvider } from '@tanstack/svelte-query-persist-client'
  import { browser } from '$app/environment'
  import type { LayoutProps } from './$types'

  let { children }: LayoutProps = $props()

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

<svelte:head>
  <title>TanStack Svelte Query Basic Example (SvelteKit)</title>
</svelte:head>

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
  <main>
    {@render children()}
  </main>
  <SvelteQueryDevtools />
</PersistQueryClientProvider>
