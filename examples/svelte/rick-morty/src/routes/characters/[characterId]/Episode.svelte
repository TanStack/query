<script lang="ts">
  import { resolve } from '$app/paths'
  import { episodesQueries } from '$lib/services/episodes/queries'
  import { createQuery } from '@tanstack/svelte-query'

  let { episodeId }: { episodeId: string } = $props()

  const query = createQuery(() => episodesQueries.detail(episodeId))
</script>

{#if query.status === 'success'}
  <article>
    <a
      class="text-blue-500 hover:underline"
      href={resolve('/episodes/[episodeId]', { episodeId })}
    >
      <h6 class="text-lg">
        {query.data.episode}. {query.data.name} - {query.data.air_date}
      </h6>
    </a>
  </article>
{/if}
