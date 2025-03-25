<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query'

  const getCharacters = async () => {
    const res = await fetch('https://swapi.dev/api/people/')
    return await res.json()
  }

  const query = createQuery(() => ({
    queryKey: ['characters'],
    queryFn: getCharacters,
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
    <h2 class="text-4xl">Characters</h2>
    {#each query.data.results as person}
      {@const personUrlParts = person.url.split('/').filter(Boolean)}
      {@const personId = personUrlParts[personUrlParts.length - 1]}
      <article>
        <a href={`/characters/${personId}`}>
          <h6 class="text-xl">{person.name}</h6>
        </a>
      </article>
    {/each}
  </div>
{/if}
