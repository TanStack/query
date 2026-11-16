<script lang="ts">
  import { resolve } from '$app/paths'
  import { episodesQueries } from '$lib/services/episodes/queries'
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => episodesQueries.list())
</script>

{#if query.status === 'pending'}
  <p>Loading...</p>
{/if}

{#if query.status === 'error'}
  <p>Error :(</p>
{/if}

{#if query.status === 'success'}
  <div>
    <h2 class="text-4xl">Episodes</h2>
    {#each query.data.results as episode (episode.id)}
      <article>
        <a
          class="text-blue-500 hover:underline"
          href={resolve('/episodes/[episodeId]', {
            episodeId: String(episode.id),
          })}
        >
          <h6 class="text-xl">
            {episode.episode} - {episode.name}
            <em>{episode.air_date}</em>
          </h6>
        </a>
      </article>
    {/each}
  </div>
{/if}
