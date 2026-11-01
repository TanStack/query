<script lang="ts">
  import { resolve } from '$app/paths'
  import { charactersQueries } from '$lib/services/characters/queries'
  import { createQuery } from '@tanstack/svelte-query'

  type Props = {
    characterId: string
  }

  let { characterId }: Props = $props()

  const query = createQuery(() => charactersQueries.detail(characterId))
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
