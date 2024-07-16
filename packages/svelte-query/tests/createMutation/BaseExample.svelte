<script lang="ts">
  import { QueryClient } from '@tanstack/query-core'
  import { setQueryClientContext } from '../../src/context'
  import { createMutation } from '../../src'
  import type { CreateMutationOptions } from '../../src/types'

  const { options } = $props<{
    options: CreateMutationOptions
  }>()

  const queryClient = new QueryClient()
  setQueryClientContext(queryClient)

  const mutation = createMutation(options)
</script>

<button onclick={() => mutation.mutate()}>Click</button>
