<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import DogList from './lib/DogList.svelte'

  type Props = {
    shadowRoot: ShadowRoot
  }

  let { shadowRoot }: Props = $props()

  const queryClient = new QueryClient()
</script>

<QueryClientProvider client={queryClient}>
  <div style="padding: 30px">
    <h2>Dog Breeds</h2>
    <DogList />
  </div>
  <SvelteQueryDevtools
    initialIsOpen={false}
    buttonPosition="bottom-left"
    shadowDOMTarget={shadowRoot}
  />
</QueryClientProvider>
