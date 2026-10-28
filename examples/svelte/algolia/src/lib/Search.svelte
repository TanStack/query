<script lang="ts">
  import SearchResults from './SearchResults.svelte'

  let query = $state('')
</script>

<div>
  <!-- It is recommended to debounce this event in prod -->
  <input bind:value={query} placeholder="Search products" />
  <SearchResults {query} />
</div>
