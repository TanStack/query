<script lang="ts">
  import { setQueryClient } from '@tanstack/svelte-query'
  import Simple from './lib/Simple.svelte'

  setQueryClient()
</script>

<main>
  <Simple />
</main>

<style>
</style>
