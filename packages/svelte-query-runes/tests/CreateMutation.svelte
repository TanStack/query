<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../context'
  import { createMutation } from '../createMutation.svelte'
  import type { CreateMutationOptions } from '../types'

  export let options: CreateMutationOptions

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(options)
</script>

<button on:click={() => mutation.mutate()}>Click</button>
