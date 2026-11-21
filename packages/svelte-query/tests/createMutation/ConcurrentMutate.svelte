<script lang="ts">
  import { sleep } from '@tanstack/query-test-utils'
  import { createMutation, setQueryClientContext } from '../../src/index.js'
  import type {
    MutationFunctionContext,
    QueryClient,
  } from '@tanstack/query-core'

  type Props = {
    queryClient: QueryClient
    onSuccessMutate: (
      data: string,
      variables: string,
      onMutateResult: unknown,
      context: MutationFunctionContext,
    ) => void
  }

  let { queryClient, onSuccessMutate }: Props = $props()

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
