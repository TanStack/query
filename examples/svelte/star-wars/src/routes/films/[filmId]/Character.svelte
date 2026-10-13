<script lang="ts">
  import { resolve } from '$app/paths'
  import { getCharacter } from '$lib/api'
  import { createQuery } from '@tanstack/svelte-query'

  let { characterId }: { characterId: string } = $props()

  const query = createQuery(() => ({
    queryKey: ['character', characterId],
    queryFn: () => getCharacter(characterId),
  }))
</script>

{#if query.status === 'success'}
  <article>
    <a
      class="text-blue-500 hover:underline"
      href={resolve('/characters/[characterId]', { characterId })}
    >
      <h6 class="text-lg">{query.data.name}</h6>
    </a>
  </article>
{/if}
