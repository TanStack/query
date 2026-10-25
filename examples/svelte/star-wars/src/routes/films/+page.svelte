<script lang="ts">
  import { resolve } from '$app/paths'
  import { filmsQueries } from '$lib/services/films/queries'
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => filmsQueries.list())
</script>

{#if query.status === 'pending'}
  <p>Loading...</p>
{/if}

{#if query.status === 'error'}
  <p>Error :(</p>
{/if}

{#if query.status === 'success'}
  <div>
    <h2 class="text-4xl">Films</h2>
    {#each query.data.results as film (film.url)}
      {@const filmUrlParts = film.url.split('/').filter(Boolean)}
      {@const filmId = filmUrlParts[filmUrlParts.length - 1]}
      <article>
        <a
          class="text-blue-500 hover:underline"
          href={resolve('/films/[filmId]', { filmId })}
        >
          <h6 class="text-xl">
            {film.episode_id}. {film.title}
            <em>
              ({new Date(Date.parse(film.release_date)).getFullYear()})
            </em>
          </h6>
        </a>
      </article>
    {/each}
  </div>
{/if}
