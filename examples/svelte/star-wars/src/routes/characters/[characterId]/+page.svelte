<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import Homeworld from './Homeworld.svelte'
  import Film from './Film.svelte'
  import { getCharacter } from '$lib/api'
  import type { PageData } from './$types'

  export let data: PageData

  const query = createQuery({
    queryKey: ['character', data.params.characterId],
    queryFn: () => getCharacter(data.params.characterId),
  })
</script>

{#if $query.status === 'pending'}
  <p>Loading...</p>
{/if}

{#if $query.status === 'error'}
  <p>Error :(</p>
{/if}

{#if $query.status === 'success'}
  {@const homeworldUrlParts = $query.data.homeworld.split('/').filter(Boolean)}
  {@const homeworldId = homeworldUrlParts[homeworldUrlParts.length - 1]}
  <h2 class="text-4xl">{$query.data.name}</h2>

  <p><strong>Born</strong>: {$query.data.birth_year}</p>
  <p><strong>Eyes</strong>: {$query.data.eye_color}</p>
  <p><strong>Hair</strong>: {$query.data.hair_color}</p>
  <p><strong>Height</strong>: {$query.data.height}</p>
  <p><strong>Mass</strong>: {$query.data.mass}</p>
  <p><strong>Homeworld</strong>: <Homeworld {homeworldId} /></p>
  <h4 class="text-2xl pt-4">Films</h4>
  {#each $query.data.films as film}
    {@const filmUrlParts = film.split('/').filter(Boolean)}
    {@const filmId = filmUrlParts[filmUrlParts.length - 1]}
    <Film {filmId} />
  {/each}
{/if}
