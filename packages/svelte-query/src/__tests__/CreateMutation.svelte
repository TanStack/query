<script lang="ts">
  import { createMutation, QueryClient } from '../index'
  import { setQueryClientContext } from '../context'

  export let mutationFn: () => Promise<string>

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation({
    mutationFn,
  })
</script>

<button on:click={() => $mutation.mutate()}>Click</button>
