<script lang="ts">
  import CharacterItem from '$lib/CharacterItem.svelte'
  import { charactersQueries } from '$lib/services/characters/queries'
  import { createQuery } from '@tanstack/svelte-query'

  let selectedChar = $state(1)

  const charactersQuery = createQuery(() => charactersQueries.list())

  const characterQuery = createQuery(() =>
    charactersQueries.detail(selectedChar),
  )
</script>

<div class="App">
  <p>
    Hovering over a character will prefetch it, and when it's been prefetched it
    will turn <strong>bold</strong>. Clicking on a prefetched character will
    show their stats below immediately, and opening its details page will render
    it without a loading state.
  </p>
  <h2>Characters</h2>
  {#if charactersQuery.isPending}
    Loading...
  {:else if charactersQuery.isError}
    <span>Error: {charactersQuery.error.message}</span>
  {:else}
    <ul>
      {#each charactersQuery.data.results as char (char.id)}
        <CharacterItem {char} onSelect={(id) => (selectedChar = id)} />
      {/each}
    </ul>

    <h3>Selected Character</h3>
    {#if characterQuery.isPending}
      Loading...
    {:else if characterQuery.isError}
      <span>Error: {characterQuery.error.message}</span>
    {:else}
      <pre>{JSON.stringify(characterQuery.data, null, 2)}</pre>
    {/if}
  {/if}
</div>
