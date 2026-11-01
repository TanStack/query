<script lang="ts">
  import '../app.css'
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import type { LayoutProps } from './$types'

  let { data, children }: LayoutProps = $props()
</script>

<QueryClientProvider client={data.queryClient}>
  <main>
    {@render children()}
  </main>
  <SvelteQueryDevtools />
</QueryClientProvider>
