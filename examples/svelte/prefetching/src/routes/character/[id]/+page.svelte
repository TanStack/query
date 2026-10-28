<script lang="ts">
  import { resolve } from '$app/paths'
  import { charactersQueries } from '$lib/services/characters/queries'
  import { createQuery } from '@tanstack/svelte-query'
  import type { PageProps } from './$types'

  let { params }: PageProps = $props()

  const query = createQuery(() =>
    charactersQueries.detail(Number(params.id) || undefined),
  )
</script>

<div style="text-align: center">
  {#if query.status === 'pending'}
    Loading...
  {:else if query.status === 'error'}
    <span>Error: {query.error.message}</span>
  {:else}
    <h1>{query.data.name}</h1>
    <div>
      <p>status: {query.data.status}</p>
      <p>species: {query.data.species}</p>
      <p>gender: {query.data.gender}</p>
      <p>origin: {query.data.origin.name}</p>
    </div>
    <div>{query.isFetching ? 'Background Updating...' : ' '}</div>
  {/if}
  <br />
  <br />
  <a href={resolve('/')}>Back</a>
</div>
