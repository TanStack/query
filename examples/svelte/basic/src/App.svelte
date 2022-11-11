<script lang="ts">
  import { setQueryClient } from '@tanstack/svelte-query'
  import BasicQuery from './lib/BasicQuery.svelte'

  setQueryClient()
</script>

<main>
  <h1>Basic Query</h1>
  <BasicQuery />
</main>

<style>
</style>
