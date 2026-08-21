<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  type Repo = {
    full_name: string
    description: string
    subscribers_count: number
    stargazers_count: number
    forks_count: number
  }

  const query = createQuery<Repo>(() => ({
    queryKey: ['repoData'],
    queryFn: async () =>
      await fetch('https://api.github.com/repos/TanStack/query').then((r) =>
        r.json(),
      ),
  }))
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
        <strong>👀 {query.data.subscribers_count}</strong>{' '}
        <strong>✨ {query.data.stargazers_count}</strong>{' '}
        <strong>🍴 {query.data.forks_count}</strong>
      </div>
    {/if}
  </div>
</div>
