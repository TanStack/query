<script lang="ts">
  import '../app.css'
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { PageData } from './$types'

  export let data: PageData
</script>

<QueryClientProvider client={data.queryClient}>
  <main>
    <slot />
  </main>
</QueryClientProvider>
