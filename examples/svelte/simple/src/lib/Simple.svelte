<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import { reposQueries } from './services/repos/queries'

  const query = createQuery(() => reposQueries.detail())
</script>

<h1>Simple</h1>
<div class="my-4">
  <div>
    {#if query.isPending}
      Loading...
    {/if}
    {#if query.error}
      An error has occurred:
      {query.error.message}
    {/if}
    {#if query.isSuccess}
      <div>
        <h1>{query.data.full_name}</h1>
        <p>{query.data.description}</p>
        <strong>👀 {query.data.subscribers_count}</strong>
        <strong>✨ {query.data.stargazers_count}</strong>
        <strong>🍴 {query.data.forks_count}</strong>
      </div>
    {/if}
  </div>
</div>
