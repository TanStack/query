<script lang="ts">

  import PersistQueryClientProvider from "../PersistQueryClientProvider.svelte";
  import RestoreCache from "./RestoreCache.svelte";
  import type { QueryClient, QueryObserverResult } from "@tanstack/svelte-query";
  import type { PersistQueryClientOptions } from "@tanstack/query-persist-client-core";
  import type { Writable } from "svelte/store"

  export let queryClient: QueryClient
  export let persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  export let key: Array<string>
  export let states: Writable<Array<QueryObserverResult<string>>>
  

</script>
<PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
  <RestoreCache key={key} states={states} />
</PersistQueryClientProvider>