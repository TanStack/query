<script lang="ts">
  import { resolve } from '$app/paths'
  import { charactersQueries } from './services/characters/queries'
  import { createQuery, noop, useQueryClient } from '@tanstack/svelte-query'
  import type { Character } from './services/characters/types'

  let { char, onSelect }: { char: Character; onSelect: (id: number) => void } =
    $props()

  const queryClient = useQueryClient()

  const query = createQuery(() => ({
    ...charactersQueries.detail(char.id),
    enabled: false,
  }))

  const prefetch = () => {
    queryClient
      .query({
        ...charactersQueries.detail(char.id),
        staleTime: 10 * 1000, // only prefetch if older than 10 seconds
      })
      .catch(noop)
  }
</script>

<li onmouseenter={prefetch} onfocusin={prefetch}>
  <button
    type="button"
    style={query.data ? 'font-weight: bold' : ''}
    onclick={() => {
      onSelect(char.id)
    }}
  >
    {char.id} - {char.name}
  </button>
  <a href={resolve('/character/[id]', { id: String(char.id) })}>details</a>
</li>
