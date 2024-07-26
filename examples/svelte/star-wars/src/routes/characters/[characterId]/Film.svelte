<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let { filmId }: { filmId: string } = $props()

  const getFilm = async () => {
    const res = await fetch(`https://swapi.dev/api/films/${filmId}/`)
    return await res.json()
  }

  const query = createQuery(() => ({
    queryKey: ['film', filmId],
    queryFn: getFilm,
  }))
</script>

{#if query.status === 'success'}
  <article>
    <a href={`/films/${filmId}`}>
      <h6 class="text-lg">{query.data.episode_id}. {query.data.title}</h6>
    </a>
  </article>
{/if}
