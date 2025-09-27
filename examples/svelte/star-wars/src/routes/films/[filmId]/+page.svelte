<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import Character from './Character.svelte'
  import { getFilm } from '$lib/api'
  import type { PageData } from './$types'

  export let data: PageData

  const query = createQuery({
    queryKey: ['film', data.params.filmId],
    queryFn: () => getFilm(data.params.filmId),
  })
</script>

{#if $query.status === 'pending'}
  <p>Loading...</p>
{/if}

{#if $query.status === 'error'}
  <p>Error :(</p>
{/if}

{#if $query.status === 'success'}
  <div>
    <h2 class="text-4xl">{$query.data.title}</h2>
    <p>{$query.data.opening_crawl}</p>
    <br />
    <h4 class="text-2xl">Characters</h4>
    {#each $query.data.characters as character}
      {@const characterUrlParts = character.split('/').filter(Boolean)}
      {@const characterId = characterUrlParts[characterUrlParts.length - 1]}
      <Character {characterId} />
    {/each}
  </div>
{/if}
