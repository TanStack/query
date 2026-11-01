<script lang="ts">
  import { resolve } from '$app/paths'
  import { charactersQueries } from '$lib/services/characters/queries'
  import { createQuery } from '@tanstack/svelte-query'

  const query = createQuery(() => charactersQueries.list())
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
    {#each query.data.results as person (person.id)}
      <article>
        <a
          class="text-blue-500 hover:underline"
          href={resolve('/characters/[characterId]', {
            characterId: String(person.id),
          })}
        >
          <h6 class="text-xl">
            {person.name} - {person.gender}: {person.species}
          </h6>
        </a>
      </article>
    {/each}
  </div>
{/if}
