<script lang="ts">
  import { createQueries } from '@tanstack/svelte-query'
  import { charactersQueries } from './services/characters/queries'

  type Props = {
    ids: Array<number>
  }

  let { ids }: Props = $props()

  const characters = createQueries(() => ({
    queries: ids.map((id) => charactersQueries.detail(id)),
  }))
</script>

{#each characters as character, index (index)}
  {#if character.status === 'pending'}
    Loading...
  {:else if character.status === 'error'}
    Error...
  {:else if character.data === null}
    Not found ...
  {:else}
    <div style="display: flex">
      <img
        width={100}
        height={100}
        alt={character.data.image}
        src={character.data.image}
      />
      <div style="padding-left: 10px; text-align: left">
        <h5 style="margin-top: 0; margin-bottom: 5px">
          {character.data.name} (#{character.data.id})
        </h5>
        <p style="margin-top: 0; margin-bottom: 2px">
          Status: {character.data.status}
        </p>
        <p style="margin-top: 0; margin-bottom: 2px">
          Species: {character.data.species}
        </p>
        <p style="margin-top: 0; margin-bottom: 2px">
          Gender: {character.data.gender}
        </p>
      </div>
    </div>
  {/if}
{/each}
