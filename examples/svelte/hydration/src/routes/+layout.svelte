<script lang="ts">
  import '../app.css'
  import {
    QueryClient,
    QueryClientProvider,
    Hydrate,
  } from '@tanstack/svelte-query'
  import { dehydratedState } from '$lib/store'

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <Hydrate state={$dehydratedState}>
    <main>
      <slot />
    </main>
  </Hydrate>
</QueryClientProvider>
