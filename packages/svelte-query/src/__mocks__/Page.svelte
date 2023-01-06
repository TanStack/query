<script lang="ts">
  import { UseQueryStoreResult } from '../lib'

  export let queryKey: Array<string>
  export let query: UseQueryStoreResult<string, unknown, string>
  export let defaultData: string | undefined = undefined

  const queryResult = query

  let { data = defaultData } = $queryResult
</script>

<div>
  {#if data}
    <h1>{data}</h1>
  {:else}
    <div class="my-4">
      {#if $queryResult.isLoading}
        Loading...
      {/if}
      {#if $queryResult.error}
        <div>Failure Count: {$queryResult.failureCount}</div>
      {/if}
      {#if $queryResult.isSuccess}
        <div>
          <h1>{$queryResult.data}</h1>
        </div>
        <button on:click={() => $queryResult.refetch()}>refetch</button>
      {/if}
      <strong>Status: {$queryResult.status}</strong>
    </div>
  {/if}
</div>
