<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
    onSuccessPerCall: (...args: Array<unknown>) => void
  }

  const { queryClient, onSuccessPerCall }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: (text: string) => sleep(10).then(() => text),
  }))
</script>

<button
  onclick={() => mutation.mutate('Todo 1', { onSuccess: onSuccessPerCall })}
>
  mutate1
</button>
<button
  onclick={() => mutation.mutate('Todo 2', { onSuccess: onSuccessPerCall })}
>
  mutate2
</button>
<div>data: {mutation.data ?? 'null'}, status: {mutation.status}</div>
