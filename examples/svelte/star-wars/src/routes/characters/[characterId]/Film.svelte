<script lang="ts">
  import { resolve } from '$app/paths'
  import { filmsQueries } from '$lib/services/films/queries'
  import { createQuery } from '@tanstack/svelte-query'

  type Props = {
    filmId: string
  }

  let { filmId }: Props = $props()

  const query = createQuery(() => filmsQueries.detail(filmId))
</script>

{#if query.status === 'success'}
  <a
    class="text-blue-500 hover:underline"
    href={resolve('/films/[filmId]', { filmId })}
  >
    <h6 class="text-lg">{query.data.episode_id}. {query.data.title}</h6>
  </a>
{/if}
