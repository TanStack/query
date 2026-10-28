<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import DogList from './lib/DogList.svelte'

  const { shadowRoot }: { shadowRoot: ShadowRoot } = $props()

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <div style="width: 100vw; padding: 30px">
    <h2>Dog Breeds</h2>
    <DogList />
  </div>
  <SvelteQueryDevtools
    initialIsOpen={false}
    buttonPosition="bottom-left"
    shadowDOMTarget={shadowRoot}
  />
</QueryClientProvider>
