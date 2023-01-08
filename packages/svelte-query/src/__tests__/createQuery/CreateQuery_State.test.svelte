<script lang="ts">
  import type {CreateQueryResult, CreateQueryStoreResult} from "$lib";
  import {createQuery, QueryClient} from "$lib";
  import {setQueryClientContext} from "$lib/context";
  import {expectType, sleep} from "../utils";

  export let queryKey: Array<string> = ["test"];

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  // unspecified query function should default to unknown.
  export let queryState: CreateQueryStoreResult<string, Error> = createQuery<string, Error>(queryKey, async () => {
    await sleep(1)
    return 'test'
  })

  queryState.subscribe(value => {
    if (value.isLoading) {
      expectType<undefined>(value.data)
      expectType<null>(value.error)
    } else if (value.isLoadingError) {
      expectType<undefined>(value.data)
      expectType<Error>(value.error)
    } else {
      expectType<string>(value.data)
      expectType<Error | null>(value.error)
    }
  })

</script>

{#if $queryState.isLoading}
  <span>loading</span>
  {:else if $queryState.isLoadingError}
  <span>{$queryState.error.message}</span>
  {:else}
  <span>{$queryState.data}</span>
  {/if}
