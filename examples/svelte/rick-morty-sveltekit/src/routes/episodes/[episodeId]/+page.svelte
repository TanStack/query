<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import Character from './Character.svelte'
  import { episodesQueries } from '$lib/services/episodes/queries'
  import type { PageProps } from './$types'

  let { params }: PageProps = $props()

  const query = createQuery(() => episodesQueries.detail(params.episodeId))
</script>

{#if query.status === 'pending'}
  <p>Loading...</p>
{/if}

{#if query.status === 'error'}
  <p>Error :(</p>
{/if}

{#if query.status === 'success'}
  <div>
    <h2 class="text-4xl">{query.data.name}</h2>
    <p>{query.data.air_date}</p>
    <br />
    <h4 class="text-2xl">Characters</h4>
    {#each query.data.characters as character (character)}
      {@const characterUrlParts = character.split('/').filter(Boolean)}
      {@const characterId = characterUrlParts[characterUrlParts.length - 1]}
      <Character {characterId} />
    {/each}
  </div>
{/if}
