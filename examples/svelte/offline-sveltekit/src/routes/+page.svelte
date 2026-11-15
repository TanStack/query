<script lang="ts">
  import { resolve } from '$app/paths'
  import { moviesQueries } from '$lib/services/movies/queries'
  import { createQuery } from '@tanstack/svelte-query'

  const moviesQuery = createQuery(() => moviesQueries.list())
</script>

{#if moviesQuery.isLoading}
  Loading...
{:else if moviesQuery.data}
  <div>
    <h1>Movies</h1>
    <p>
      Try to mock offline behavior with the button in the devtools. You can
      navigate around as long as there is already data in the cache. You'll get
      a refetch as soon as you go online again.
    </p>
    <ul>
      {#each moviesQuery.data.movies as movie (movie.id)}
        <li>
          <a href={resolve('/[movieId]', { movieId: movie.id })}>
            {movie.title}
          </a>
        </li>
      {/each}
    </ul>
    <div>
      Updated at: {new Date(moviesQuery.data.ts).toLocaleTimeString()}
    </div>
    <div>{moviesQuery.isFetching ? 'fetching...' : ''}</div>
  </div>
{:else if moviesQuery.isError}
  <div>
    <h1>Couldn't load movies!</h1>
    <div>{moviesQuery.error.message}</div>
  </div>
{/if}
