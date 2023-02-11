<script lang="ts">
  import {
    createMutation,
    QueryClient,
    type CreateMutationOptions,
  } from '../index'
  import { setQueryClientContext } from '../context'

  export let options: CreateMutationOptions

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(options)
</script>

<button on:click={() => $mutation.mutate()}>Click</button>
