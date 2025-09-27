<script lang="ts">
  import { getFilm } from '$lib/api'
  import { createQuery } from '@tanstack/svelte-query'

  export let filmId: string

  const query = createQuery({
    queryKey: ['film', filmId],
    queryFn: () => getFilm(filmId),
  })
</script>

{#if $query.status === 'success'}
  <a class="text-blue-500 hover:underline" href={`/films/${filmId}`}>
    <h6 class="text-lg">{$query.data.episode_id}. {$query.data.title}</h6>
  </a>
{/if}
