<script lang="ts">
  import type { UseQueryStoreResult } from '../lib'

  export let queryKey: Array<string>
  export let query: UseQueryStoreResult<string, unknown, string>
  export let defaultData: string | undefined = undefined

  let { data = defaultData } = $query
</script>

<div>
  {#if data}
    <h1>{data}</h1>
  {:else}
    <div class="my-4">
      {#if $query.isLoading}
        Loading...
      {/if}
      {#if $query.error}
        <div>Failure Count: {$query.failureCount}</div>
      {/if}
      {#if $query.isSuccess}
        <div>
          <h1>{$query.data}</h1>
        </div>
        <button on:click={() => $query.refetch()}>refetch</button>
      {/if}
      <strong>Status: {$query.status}</strong>
    </div>
  {/if}
</div>
