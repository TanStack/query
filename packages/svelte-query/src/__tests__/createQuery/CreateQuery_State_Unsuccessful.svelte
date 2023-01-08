<script lang="ts">
  import {createQuery, QueryClient} from "$lib";
  import {setQueryClientContext} from "$lib/context";

  export let queryKey: Array<string> = ["test"];

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  export let queryState = createQuery<string[], string, undefined>(
    queryKey,
    () => Promise.reject('rejected'),
    {
      retry: 1,
      retryDelay: 1,
    },
  )

</script>

<span>Status:{$queryState.status}</span>
<span>Failure Count:{$queryState.failureCount}</span>
<span>Failure Reason{$queryState.failureReason}</span>
