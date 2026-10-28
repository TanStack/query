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
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<li
  onclick={() => {
    onSelect(char.id)
  }}
  onmouseenter={() => {
    queryClient
      .query({
        ...charactersQueries.detail(char.id),
        staleTime: 10 * 1000, // only prefetch if older than 10 seconds
      })
      .catch(noop)
  }}
>
  <div style={query.data ? 'font-weight: bold' : ''}>
    {char.id} - {char.name}
    <a href={resolve('/character/[id]', { id: String(char.id) })}>details</a>
  </div>
</li>
