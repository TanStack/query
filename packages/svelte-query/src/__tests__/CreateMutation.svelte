<script lang="ts">
  import { createMutation, QueryClient } from '../lib'
  import { setQueryClientContext } from '../lib/context'

  export let queryFn: () => Promise<string>

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(queryFn)
</script>

<button on:click={$mutation.mutate}>Click</button>
