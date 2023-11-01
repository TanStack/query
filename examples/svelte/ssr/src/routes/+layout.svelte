<script lang="ts">
  import '../app.css'
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import type { PageData } from './$types'

  export let data: PageData
</script>

<QueryClientProvider client={data.queryClient}>
  <main>
    <slot />
  </main>
  <SvelteQueryDevtools />
</QueryClientProvider>
