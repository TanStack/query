<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import Episode from './Episode.svelte'
  import Location from './Location.svelte'
  import { charactersQueries } from '$lib/services/characters/queries'
  import type { PageProps } from './$types'

  let { params }: PageProps = $props()

  const query = createQuery(() => charactersQueries.detail(params.characterId))
</script>

{#if query.status === 'pending'}
  <p>Loading...</p>
{/if}

{#if query.status === 'error'}
  <p>Error :(</p>
{/if}

{#if query.status === 'success'}
  {@const locationUrlParts = query.data.location.url.split('/').filter(Boolean)}
  {@const locationId = locationUrlParts[locationUrlParts.length - 1]}
  <div>
    <h2 class="text-4xl">{query.data.name}</h2>
    <p><strong>Gender</strong>: {query.data.gender}</p>
    <p><strong>Status</strong>: {query.data.status}</p>
    <p><strong>Species</strong>: {query.data.species}</p>
    <p><strong>Origin</strong>: {query.data.origin.name}</p>
    <p>
      <strong>Location</strong>:
      {#if locationId}
        <Location {locationId} />
      {:else}
        {query.data.location.name}
      {/if}
    </p>

    <h4 class="text-2xl pt-4">Episodes</h4>
    {#each query.data.episode as episode (episode)}
      {@const episodeUrlParts = episode.split('/').filter(Boolean)}
      {@const episodeId = episodeUrlParts[episodeUrlParts.length - 1]}
      <Episode {episodeId} />
    {/each}
  </div>
{/if}
