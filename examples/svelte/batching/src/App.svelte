<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools'
  import Characters from './lib/Characters.svelte'

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
      },
    },
  })

  let ids = $state<Array<number>>([])
  let idsToLoad = $state<Array<number>>([])
  let error = $state('')

  const handleInput = (value: string) => {
    const text = value.replace(' ', '')
    const parsedIds = text.split(',').map((id) => parseInt(id, 10))
    const allValid = parsedIds.reduce((valid, id) => valid && !isNaN(id), true)

    if (allValid) {
      ids = parsedIds
      error = ''
    } else {
      error = 'Invalid.. only use numbers and comma'
    }
  }
</script>

<QueryClientProvider client={queryClient}>
  <div class="App">
    <h2>Character fetcher</h2>
    <div>
      <label for="ids" style="display: block">
        Character ids (numeric, comma separated)
      </label>
      <input
        id="ids"
        style="display: inline-block"
        placeholder="ids"
        oninput={(event) => handleInput(event.currentTarget.value)}
      />
    </div>

    {#if error}
      <h3 style="color: red">{error}</h3>
    {/if}

    <button
      type="button"
      onclick={() => {
        idsToLoad = ids
      }}
    >
      Load characters
    </button>
    <div>
      <h4 style="text-align: left">Characters:</h4>
      <Characters ids={idsToLoad} />
    </div>
  </div>
  <SvelteQueryDevtools initialIsOpen />
</QueryClientProvider>
