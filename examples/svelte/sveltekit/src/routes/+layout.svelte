<script lang="ts">
  import '../app.css'
  import { setQueryClient } from '@tanstack/svelte-query'

  setQueryClient()
</script>

<svelte:head>
  <title>SvelteKit Example</title>
</svelte:head>

<div id="app">
  <slot />
</div>
