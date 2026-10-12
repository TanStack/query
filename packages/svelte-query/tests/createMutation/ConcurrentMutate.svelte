<script lang="ts">
  import type { QueryClient } from '@tanstack/query-core'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import { sleep } from '@tanstack/query-test-utils'

  type Props = {
    queryClient: QueryClient
    onSuccessMutate: (...args: Array<unknown>) => void
  }

  const { queryClient, onSuccessMutate }: Props = $props()

  setQueryClientContext(queryClient)

  const mutation = createMutation(() => ({
    mutationFn: (text: string) => sleep(10).then(() => text),
  }))
</script>

<button
  onclick={() => mutation.mutate('Todo 1', { onSuccess: onSuccessMutate })}
>
  mutate1
</button>
<button
  onclick={() => mutation.mutate('Todo 2', { onSuccess: onSuccessMutate })}
>
  mutate2
</button>
<div>data: {mutation.data ?? 'null'}, status: {mutation.status}</div>
