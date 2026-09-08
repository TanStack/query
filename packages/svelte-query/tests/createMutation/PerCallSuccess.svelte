<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
    perCallOnSuccess: (...args: Array<unknown>) => void
  }

  const { queryClient, perCallOnSuccess }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: (text: string) => sleep(10).then(() => text),
  }))
</script>

<button
  onclick={() => mutation.mutate('todo', { onSuccess: perCallOnSuccess })}
>
  Mutate
</button>
