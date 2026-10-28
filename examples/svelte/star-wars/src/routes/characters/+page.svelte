<script lang="ts">
  import { resolve } from '$app/paths'
  import { createQuery } from '@tanstack/svelte-query'
  import { charactersQueries } from '$lib/services/characters/queries'

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
    {#each query.data.results as person (person.url)}
      {@const personUrlParts = person.url.split('/').filter(Boolean)}
      {@const personId = personUrlParts[personUrlParts.length - 1]}
      <article>
        <a
          class="text-blue-500 hover:underline"
          href={resolve('/characters/[characterId]', { characterId: personId })}
        >
          <h6 class="text-xl">{person.name}</h6>
        </a>
      </article>
    {/each}
  </div>
{/if}
