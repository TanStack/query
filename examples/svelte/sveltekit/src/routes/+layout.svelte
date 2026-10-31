<script lang="ts">
  import '../app.css'
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import type { LayoutProps } from './$types'

  let { data, children }: LayoutProps = $props()
</script>

<svelte:head>
  <title>TanStack Query SvelteKit Example</title>
</svelte:head>

<QueryClientProvider client={data.queryClient}>
  {@render children()}
  <SvelteQueryDevtools buttonPosition="bottom-right" />
</QueryClientProvider>
