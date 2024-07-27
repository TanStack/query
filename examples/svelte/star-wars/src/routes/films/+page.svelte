<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const getFilms = async () => {
    const res = await fetch('https://swapi.dev/api/films/')
    return await res.json()
  }

  const query = createQuery(() => ({
    queryKey: ['films'],
    queryFn: getFilms,
  }))
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
    {#each query.data.results as film}
      {@const filmUrlParts = film.url.split('/').filter(Boolean)}
      {@const filmId = filmUrlParts[filmUrlParts.length - 1]}
      <article>
        <a href={`/films/${filmId}`}>
          <h6 class="text-xl">
            {film.episode_id}. {film.title}{' '}
            <em>
              ({new Date(Date.parse(film.release_date)).getFullYear()})
            </em>
          </h6>
        </a>
      </article>
    {/each}
  </div>
{/if}
