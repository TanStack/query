<script lang="ts">
  import type {CreateQueryOptions, CreateQueryStoreResult} from "$lib";
  import {createQuery, QueryClient} from "$lib";
  import {setQueryClientContext} from "$lib/context";
  import {expectType, sleep} from "../utils";

  export let queryFn: () => Promise<string> = async () => 'data'
  export let queryKey: Array<string> = ["test"];
  export let options : Omit<
      CreateQueryOptions<string, Error, string>,
      'queryKey' | 'queryFn' | 'initialData'
    > & { initialData?: () => undefined } = {};

  export let queryClient = new QueryClient();
  setQueryClientContext(queryClient)

  // unspecified query function should default to unknown.
  export let queryState: CreateQueryStoreResult<string, Error> = createQuery<string, Error>(queryKey, queryFn, Object.keys(options).length > 0 ? options : undefined)

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


<span>Status:{$queryState.status}</span>
<span>Failure Count:{$queryState.failureCount}</span>
<span>Failure Reason:{$queryState.failureReason}</span>
{#if $queryState.isLoadingError}
<span>Error Message:{$queryState.error.message}</span>
{/if}
<span>{$queryState.data}</span>
