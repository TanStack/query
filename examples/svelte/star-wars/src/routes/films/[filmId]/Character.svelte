<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  let { characterId }: { characterId: string } = $props()

  const getCharacter = async () => {
    const res = await fetch(`https://swapi.dev/api/people/${characterId}/`)
    return await res.json()
  }

  const query = createQuery(() => ({
    queryKey: ['character', characterId],
    queryFn: getCharacter,
  }))
</script>

{#if query.status === 'success'}
  <article>
    <a href={`/characters/${characterId}`}>
      <h6 class="text-lg">{query.data.name}</h6>
    </a>
  </article>
{/if}
