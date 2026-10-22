<script lang="ts">
  import { resolve } from '$app/paths'
  import { filmQueryOptions } from '$lib/api'
  import { createQuery } from '@tanstack/svelte-query'

  let { filmId }: { filmId: string } = $props()

  const query = createQuery(() => filmQueryOptions(filmId))
</script>

{#if query.status === 'success'}
  <a
    class="text-blue-500 hover:underline"
    href={resolve('/films/[filmId]', { filmId })}
  >
    <h6 class="text-lg">{query.data.episode_id}. {query.data.title}</h6>
  </a>
{/if}
