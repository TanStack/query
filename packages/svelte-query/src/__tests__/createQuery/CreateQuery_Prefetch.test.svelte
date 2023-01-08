<script lang="ts">
  import type { QueryClient} from "$lib";
  import {createQuery} from "$lib";
  import {setQueryClientContext} from "$lib/context";

  export let queryClient : QueryClient;
  export let queryKey: Array<string>;
  setQueryClientContext(queryClient);

  export let queryState = createQuery(queryKey, () => 'data')
</script>

<span>{$queryState.data}</span>
