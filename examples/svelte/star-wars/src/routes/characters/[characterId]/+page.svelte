<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'
  import Homeworld from './Homeworld.svelte'
  import Film from './Film.svelte'

  let { data } = $props()

  const getCharacter = async () => {
    const res = await fetch(
      `https://swapi.dev/api/people/${data.params.characterId}/`,
    )
    return await res.json()
  }

  const query = createQuery(() => ({
    queryKey: ['character', data.params.characterId],
    queryFn: getCharacter,
  }))
</script>

{#if query.status === 'pending'}
  <p>Loading...</p>
{/if}

{#if query.status === 'error'}
  <p>Error :(</p>
{/if}

{#if query.status === 'success'}
  {@const homeworldUrlParts = query.data.homeworld.split('/').filter(Boolean)}
  {@const homeworldId = homeworldUrlParts[homeworldUrlParts.length - 1]}
  <div>
    <h2 class="text-4xl">{query.data.name}</h2>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Born</td>
          <td>{query.data.birth_year}</td>
        </tr>
        <tr>
          <td>Eyes</td>
          <td>{query.data.eye_color}</td>
        </tr>
        <tr>
          <td>Hair</td>
          <td>{query.data.hair_color}</td>
        </tr>
        <tr>
          <td>Height</td>
          <td>{query.data.height}</td>
        </tr>
        <tr>
          <td>Mass</td>
          <td>{query.data.mass}</td>
        </tr>
        <tr>
          <td>Homeworld</td>
          <td><Homeworld {homeworldId} /></td>
        </tr>
      </tbody>
    </table>
    <br />
    <h4 class="text-2xl">Films</h4>
    {#each query.data.films as film}
      {@const filmUrlParts = film.split('/').filter(Boolean)}
      {@const filmId = filmUrlParts[filmUrlParts.length - 1]}
      <Film {filmId} />
    {/each}
  </div>
{/if}
