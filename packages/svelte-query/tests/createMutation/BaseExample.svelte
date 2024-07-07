<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../../src/context'
  import { createMutation } from '../../src/createMutation'
  import type { CreateMutationOptions } from '../../src/types'

  export let options: CreateMutationOptions

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(options)
</script>

<button on:click={() => mutation.mutate()}>Click</button>
