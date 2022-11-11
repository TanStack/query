<script lang="ts">
  import { setQueryClient } from '@tanstack/svelte-query'
  import LoadMore from './lib/LoadMore.svelte'
  setQueryClient()
</script>

<main>
  <h1>Infinte Load More</h1>
  <LoadMore />
</main>

<style>
</style>
