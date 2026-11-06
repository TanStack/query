<script lang="ts">
  import { createDebouncedValue } from '@tanstack/svelte-pacer/debouncer'
  import SearchResults from './SearchResults.svelte'

  let query = $state('')
  const [debouncedQuery] = createDebouncedValue(() => query, { wait: 300 })
</script>

<div>
  <input bind:value={query} placeholder="Search products" />
  <SearchResults query={debouncedQuery()} />
</div>
