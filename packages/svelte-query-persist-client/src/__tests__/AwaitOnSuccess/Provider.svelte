<script lang="ts">

  import PersistQueryClientProvider from "../../PersistQueryClientProvider.svelte";
  import AwaitOnSuccess from "./AwaitOnSuccess.svelte";
  import type { QueryClient } from "@tanstack/svelte-query";
  import type { PersistQueryClientOptions } from "@tanstack/query-persist-client-core";
  import type { Writable } from "svelte/store"
  import type { StatusResult } from '../utils'

  export let queryClient: QueryClient
  export let persistOptions: Omit<PersistQueryClientOptions, 'queryClient'>
  export let key: Array<string>
  export let onSuccess: () => Promise<void>
  export let states: Writable<StatusResult<string>[]> 


</script>
<PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}  onSuccess={onSuccess}>
  <AwaitOnSuccess key={key}  states={states} />
</PersistQueryClientProvider>